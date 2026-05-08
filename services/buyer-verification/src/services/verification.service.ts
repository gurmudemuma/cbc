import axios from 'axios';
import { Pool, PoolClient } from 'pg';
import { logger } from '../utils/logger';
import {
  Buyer,
  VerificationResult,
  VerificationResults,
  VerificationType,
  VerificationStatus,
} from '../types';

/**
 * Buyer Verification Service
 * Integrates with external APIs for comprehensive buyer verification
 */
export class VerificationService {
  /**
   * Main verification orchestrator
   */
  async verifyBuyer(
    pool: Pool,
    buyerId: string,
    verificationType: VerificationType = 'FULL',
  ): Promise<VerificationResults> {
    const buyer = await this.getBuyerDetails(pool, buyerId);

    if (!buyer) {
      throw new Error(`Buyer ${buyerId} not found`);
    }

    const verificationResults: VerificationResults = {};

    if (verificationType === 'FULL' || verificationType === 'CREDIT_CHECK') {
      verificationResults.creditCheck = await this.performCreditCheck(buyer);
    }

    if (verificationType === 'FULL' || verificationType === 'SANCTIONS_SCREENING') {
      verificationResults.sanctionsCheck = await this.performSanctionsScreening(buyer);
    }

    if (verificationType === 'FULL' || verificationType === 'COMPANY_REGISTRY') {
      verificationResults.companyRegistry = await this.verifyCompanyRegistry(buyer);
    }

    await this.saveVerificationRecords(pool, buyerId, verificationResults);
    await this.updateBuyerVerificationStatus(pool, buyerId, verificationResults);

    return verificationResults;
  }

  /**
   * Get buyer details from database
   */
  async getBuyerDetails(pool: Pool, buyerId: string): Promise<Buyer | undefined> {
    const query = 'SELECT * FROM buyer_registry WHERE buyer_id = $1';
    const result = await pool.query<Buyer>(query, [buyerId]);
    return result.rows[0];
  }

  /**
   * Credit check via external API (Dun & Bradstreet, Creditsafe, etc.)
   */
  async performCreditCheck(buyer: Buyer): Promise<VerificationResult> {
    try {
      logger.info(`Performing credit check for ${buyer.company_name}`);

      if (process.env.CREDIT_CHECK_API_KEY) {
        const response = await axios.post<{ creditScore: number; creditRating: string }>(
          process.env.CREDIT_CHECK_API_URL!,
          {
            companyName: buyer.company_name,
            country: buyer.country,
            registrationNumber: buyer.registration_number,
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.CREDIT_CHECK_API_KEY}`,
              'Content-Type': 'application/json',
            },
          },
        );

        return {
          status: 'PASSED',
          score: response.data.creditScore,
          rating: response.data.creditRating,
          details: response.data as unknown as Record<string, unknown>,
          provider: 'CreditCheckAPI',
        };
      }

      return this.mockCreditCheck(buyer);
    } catch (error) {
      logger.error('Credit check error:', error);
      return {
        status: 'ERROR',
        error: (error as Error).message,
        provider: 'CreditCheckAPI',
      };
    }
  }

  /**
   * Sanctions screening (OFAC, UN, EU sanctions lists)
   */
  async performSanctionsScreening(buyer: Buyer): Promise<VerificationResult> {
    try {
      logger.info(`Performing sanctions screening for ${buyer.company_name}`);

      if (process.env.SANCTIONS_API_KEY) {
        const response = await axios.post<{ matches: unknown[]; listsChecked: string[] }>(
          process.env.SANCTIONS_API_URL!,
          { name: buyer.company_name, country: buyer.country, type: 'COMPANY' },
          {
            headers: {
              Authorization: `Bearer ${process.env.SANCTIONS_API_KEY}`,
              'Content-Type': 'application/json',
            },
          },
        );

        return {
          status: response.data.matches.length === 0 ? 'PASSED' : 'FAILED',
          matches: response.data.matches,
          lists: response.data.listsChecked,
          provider: 'SanctionsAPI',
        };
      }

      return this.mockSanctionsCheck(buyer);
    } catch (error) {
      logger.error('Sanctions screening error:', error);
      return {
        status: 'ERROR',
        error: (error as Error).message,
        provider: 'SanctionsAPI',
      };
    }
  }

  /**
   * Company registry verification
   */
  async verifyCompanyRegistry(buyer: Buyer): Promise<VerificationResult> {
    try {
      logger.info(`Verifying company registry for ${buyer.company_name}`);

      if (process.env.COMPANY_REGISTRY_API_KEY) {
        const response = await axios.get<{ found: boolean; company: Record<string, unknown> }>(
          `${process.env.COMPANY_REGISTRY_API_URL}/search`,
          {
            params: {
              name: buyer.company_name,
              jurisdiction: buyer.country,
              registrationNumber: buyer.registration_number,
            },
            headers: {
              Authorization: `Bearer ${process.env.COMPANY_REGISTRY_API_KEY}`,
            },
          },
        );

        return {
          status: response.data.found ? 'PASSED' : 'FAILED',
          companyDetails: response.data.company,
          provider: 'CompanyRegistryAPI',
        };
      }

      return this.mockCompanyRegistryCheck(buyer);
    } catch (error) {
      logger.error('Company registry verification error:', error);
      return {
        status: 'ERROR',
        error: (error as Error).message,
        provider: 'CompanyRegistryAPI',
      };
    }
  }

  /**
   * Save verification records to database
   */
  async saveVerificationRecords(
    pool: Pool,
    buyerId: string,
    verificationResults: VerificationResults,
  ): Promise<void> {
    const client: PoolClient = await pool.connect();

    try {
      await client.query('BEGIN');

      for (const [type, result] of Object.entries(verificationResults) as [
        string,
        VerificationResult,
      ][]) {
        const verificationType = this.mapVerificationType(type);

        await client.query(
          `INSERT INTO buyer_verification_records (
            buyer_id, verification_type, provider, status,
            score, details, raw_response
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            buyerId,
            verificationType,
            result.provider,
            result.status,
            result.score ?? null,
            JSON.stringify(result.details ?? {}),
            JSON.stringify(result),
          ],
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update buyer verification status
   */
  async updateBuyerVerificationStatus(
    pool: Pool,
    buyerId: string,
    verificationResults: VerificationResults,
  ): Promise<void> {
    const results = Object.values(verificationResults) as VerificationResult[];
    const allPassed = results.every((r) => r.status === 'PASSED');
    const anyFailed = results.some((r) => r.status === 'FAILED');

    let verificationStatus: VerificationStatus = 'PENDING';
    if (allPassed) verificationStatus = 'VERIFIED';
    else if (anyFailed) verificationStatus = 'REJECTED';

    await pool.query(
      `UPDATE buyer_registry
       SET verification_status = $1,
           verification_date = CURRENT_TIMESTAMP,
           sanctions_check_status = $2,
           sanctions_check_date = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE buyer_id = $3`,
      [verificationStatus, verificationResults.sanctionsCheck?.status ?? 'PENDING', buyerId],
    );
  }

  private mapVerificationType(type: string): string {
    const mapping: Record<string, string> = {
      creditCheck: 'CREDIT_CHECK',
      sanctionsCheck: 'SANCTIONS_SCREENING',
      companyRegistry: 'COMPANY_REGISTRY',
    };
    return mapping[type] ?? type.toUpperCase();
  }

  // ─── Mock helpers for development ──────────────────────────────────────────

  private mockCreditCheck(buyer: Buyer): VerificationResult {
    const score = Math.floor(Math.random() * 40) + 60; // 60–100
    return {
      status: score >= 70 ? 'PASSED' : 'FAILED',
      score,
      rating: score >= 90 ? 'AAA' : score >= 80 ? 'AA' : score >= 70 ? 'A' : 'BBB',
      details: {
        paymentHistory: 'Good',
        outstandingDebts: 'Low',
        yearsInBusiness: Math.floor(Math.random() * 20) + 5,
        companyName: buyer.company_name,
      },
      provider: 'MockCreditAPI',
    };
  }

  private mockSanctionsCheck(buyer: Buyer): VerificationResult {
    const passed = Math.random() > 0.05; // 95% pass rate
    return {
      status: passed ? 'PASSED' : 'FAILED',
      matches: passed
        ? []
        : [{ name: buyer.company_name, list: 'OFAC', matchScore: 0.85 }],
      lists: ['OFAC', 'UN', 'EU'],
      provider: 'MockSanctionsAPI',
    };
  }

  private mockCompanyRegistryCheck(buyer: Buyer): VerificationResult {
    return {
      status: 'PASSED',
      companyDetails: {
        name: buyer.company_name,
        registrationNumber: buyer.registration_number,
        status: 'Active',
        incorporationDate: '2015-01-01',
        address: buyer.address,
      },
      provider: 'MockRegistryAPI',
    };
  }
}

export default new VerificationService();
