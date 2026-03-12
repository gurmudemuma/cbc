const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Buyer Verification Service
 * Integrates with external APIs for comprehensive buyer verification
 */

class VerificationService {
  
  /**
   * Main verification orchestrator
   */
  async verifyBuyer(pool, buyerId, verificationType = 'FULL') {
    const buyer = await this.getBuyerDetails(pool, buyerId);
    
    if (!buyer) {
      throw new Error(`Buyer ${buyerId} not found`);
    }
    
    const verificationResults = {};
    
    // Run verification checks based on type
    if (verificationType === 'FULL' || verificationType === 'CREDIT_CHECK') {
      verificationResults.creditCheck = await this.performCreditCheck(buyer);
    }
    
    if (verificationType === 'FULL' || verificationType === 'SANCTIONS_SCREENING') {
      verificationResults.sanctionsCheck = await this.performSanctionsScreening(buyer);
    }
    
    if (verificationType === 'FULL' || verificationType === 'COMPANY_REGISTRY') {
      verificationResults.companyRegistry = await this.verifyCompanyRegistry(buyer);
    }
    
    // Save verification records
    await this.saveVerificationRecords(pool, buyerId, verificationResults);
    
    // Update buyer verification status
    await this.updateBuyerVerificationStatus(pool, buyerId, verificationResults);
    
    return verificationResults;
  }
  
  /**
   * Get buyer details from database
   */
  async getBuyerDetails(pool, buyerId) {
    const query = 'SELECT * FROM buyer_registry WHERE buyer_id = $1';
    const result = await pool.query(query, [buyerId]);
    return result.rows[0];
  }
  
  /**
   * Credit check via external API (Dun & Bradstreet, Creditsafe, etc.)
   */
  async performCreditCheck(buyer) {
    try {
      logger.info(`Performing credit check for ${buyer.company_name}`);
      
      // In production, integrate with actual credit check API
      // Example: Dun & Bradstreet, Creditsafe, Experian
      
      if (process.env.CREDIT_CHECK_API_KEY) {
        const response = await axios.post(
          process.env.CREDIT_CHECK_API_URL,
          {
            companyName: buyer.company_name,
            country: buyer.country,
            registrationNumber: buyer.registration_number
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.CREDIT_CHECK_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        return {
          status: 'PASSED',
          score: response.data.creditScore,
          rating: response.data.creditRating,
          details: response.data,
          provider: 'CreditCheckAPI'
        };
      }
      
      // Mock response for development
      return this.mockCreditCheck(buyer);
      
    } catch (error) {
      logger.error('Credit check error:', error);
      return {
        status: 'ERROR',
        error: error.message,
        provider: 'CreditCheckAPI'
      };
    }
  }
  
  /**
   * Sanctions screening (OFAC, UN, EU sanctions lists)
   */
  async performSanctionsScreening(buyer) {
    try {
      logger.info(`Performing sanctions screening for ${buyer.company_name}`);
      
      // In production, integrate with sanctions screening API
      // Example: Dow Jones Risk & Compliance, ComplyAdvantage, World-Check
      
      if (process.env.SANCTIONS_API_KEY) {
        const response = await axios.post(
          process.env.SANCTIONS_API_URL,
          {
            name: buyer.company_name,
            country: buyer.country,
            type: 'COMPANY'
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.SANCTIONS_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        return {
          status: response.data.matches.length === 0 ? 'PASSED' : 'FAILED',
          matches: response.data.matches,
          lists: response.data.listsChecked,
          provider: 'SanctionsAPI'
        };
      }
      
      // Mock response for development
      return this.mockSanctionsCheck(buyer);
      
    } catch (error) {
      logger.error('Sanctions screening error:', error);
      return {
        status: 'ERROR',
        error: error.message,
        provider: 'SanctionsAPI'
      };
    }
  }
  
  /**
   * Company registry verification
   */
  async verifyCompanyRegistry(buyer) {
    try {
      logger.info(`Verifying company registry for ${buyer.company_name}`);
      
      // In production, integrate with company registry APIs
      // Example: OpenCorporates, Companies House (UK), etc.
      
      if (process.env.COMPANY_REGISTRY_API_KEY) {
        const response = await axios.get(
          `${process.env.COMPANY_REGISTRY_API_URL}/search`,
          {
            params: {
              name: buyer.company_name,
              jurisdiction: buyer.country,
              registrationNumber: buyer.registration_number
            },
            headers: {
              'Authorization': `Bearer ${process.env.COMPANY_REGISTRY_API_KEY}`
            }
          }
        );
        
        return {
          status: response.data.found ? 'PASSED' : 'FAILED',
          companyDetails: response.data.company,
          provider: 'CompanyRegistryAPI'
        };
      }
      
      // Mock response for development
      return this.mockCompanyRegistryCheck(buyer);
      
    } catch (error) {
      logger.error('Company registry verification error:', error);
      return {
        status: 'ERROR',
        error: error.message,
        provider: 'CompanyRegistryAPI'
      };
    }
  }
  
  /**
   * Save verification records to database
   */
  async saveVerificationRecords(pool, buyerId, verificationResults) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      for (const [type, result] of Object.entries(verificationResults)) {
        const verificationType = this.mapVerificationType(type);
        
        await client.query(`
          INSERT INTO buyer_verification_records (
            buyer_id, verification_type, provider, status, 
            score, details, raw_response
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          buyerId,
          verificationType,
          result.provider,
          result.status,
          result.score || null,
          JSON.stringify(result.details || {}),
          JSON.stringify(result)
        ]);
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
  async updateBuyerVerificationStatus(pool, buyerId, verificationResults) {
    const allPassed = Object.values(verificationResults).every(r => r.status === 'PASSED');
    const anyFailed = Object.values(verificationResults).some(r => r.status === 'FAILED');
    
    let verificationStatus = 'PENDING';
    if (allPassed) {
      verificationStatus = 'VERIFIED';
    } else if (anyFailed) {
      verificationStatus = 'REJECTED';
    }
    
    await pool.query(`
      UPDATE buyer_registry 
      SET verification_status = $1,
          verification_date = CURRENT_TIMESTAMP,
          sanctions_check_status = $2,
          sanctions_check_date = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE buyer_id = $3
    `, [
      verificationStatus,
      verificationResults.sanctionsCheck?.status || 'PENDING',
      buyerId
    ]);
  }
  
  mapVerificationType(type) {
    const mapping = {
      creditCheck: 'CREDIT_CHECK',
      sanctionsCheck: 'SANCTIONS_SCREENING',
      companyRegistry: 'COMPANY_REGISTRY'
    };
    return mapping[type] || type.toUpperCase();
  }
  
  // Mock functions for development
  mockCreditCheck(buyer) {
    const score = Math.floor(Math.random() * 40) + 60; // 60-100
    return {
      status: score >= 70 ? 'PASSED' : 'FAILED',
      score,
      rating: score >= 90 ? 'AAA' : score >= 80 ? 'AA' : score >= 70 ? 'A' : 'BBB',
      details: {
        paymentHistory: 'Good',
        outstandingDebts: 'Low',
        yearsInBusiness: Math.floor(Math.random() * 20) + 5
      },
      provider: 'MockCreditAPI'
    };
  }
  
  mockSanctionsCheck(buyer) {
    // 95% pass rate for mock
    const passed = Math.random() > 0.05;
    return {
      status: passed ? 'PASSED' : 'FAILED',
      matches: passed ? [] : [{
        name: buyer.company_name,
        list: 'OFAC',
        matchScore: 0.85
      }],
      lists: ['OFAC', 'UN', 'EU'],
      provider: 'MockSanctionsAPI'
    };
  }
  
  mockCompanyRegistryCheck(buyer) {
    return {
      status: 'PASSED',
      companyDetails: {
        name: buyer.company_name,
        registrationNumber: buyer.registration_number,
        status: 'Active',
        incorporationDate: '2015-01-01',
        address: buyer.address
      },
      provider: 'MockRegistryAPI'
    };
  }
}

module.exports = new VerificationService();
