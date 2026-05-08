import { Pool } from 'pg';
import { RiskScoreResult } from '../types';
/**
 * Risk Scoring Service
 * Calculates comprehensive risk scores for buyers based on various factors
 */
export declare class RiskScoringService {
    /**
     * Calculate comprehensive risk score for a buyer
     */
    calculateRiskScore(pool: Pool, buyerId: string): Promise<RiskScoreResult>;
    private getBuyerDetails;
    private getVerificationHistory;
    private getTransactionHistory;
    private calculateCreditRisk;
    private calculateComplianceRisk;
    private calculateTransactionRisk;
    private calculateGeographicRisk;
    private calculateIndustryRisk;
    private scoreToLevel;
    private determineRiskLevel;
    private generateRecommendations;
    /**
     * Save risk score to database
     */
    private saveRiskScore;
}
declare const _default: RiskScoringService;
export default _default;
//# sourceMappingURL=risk-scoring.service.d.ts.map