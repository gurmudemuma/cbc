import { Pool } from 'pg';
import { Buyer, VerificationResult, VerificationResults, VerificationType } from '../types';
/**
 * Buyer Verification Service
 * Integrates with external APIs for comprehensive buyer verification
 */
export declare class VerificationService {
    /**
     * Main verification orchestrator
     */
    verifyBuyer(pool: Pool, buyerId: string, verificationType?: VerificationType): Promise<VerificationResults>;
    /**
     * Get buyer details from database
     */
    getBuyerDetails(pool: Pool, buyerId: string): Promise<Buyer | undefined>;
    /**
     * Credit check via external API (Dun & Bradstreet, Creditsafe, etc.)
     */
    performCreditCheck(buyer: Buyer): Promise<VerificationResult>;
    /**
     * Sanctions screening (OFAC, UN, EU sanctions lists)
     */
    performSanctionsScreening(buyer: Buyer): Promise<VerificationResult>;
    /**
     * Company registry verification
     */
    verifyCompanyRegistry(buyer: Buyer): Promise<VerificationResult>;
    /**
     * Save verification records to database
     */
    saveVerificationRecords(pool: Pool, buyerId: string, verificationResults: VerificationResults): Promise<void>;
    /**
     * Update buyer verification status
     */
    updateBuyerVerificationStatus(pool: Pool, buyerId: string, verificationResults: VerificationResults): Promise<void>;
    private mapVerificationType;
    private mockCreditCheck;
    private mockSanctionsCheck;
    private mockCompanyRegistryCheck;
}
declare const _default: VerificationService;
export default _default;
//# sourceMappingURL=verification.service.d.ts.map