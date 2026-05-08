"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskScoringService = void 0;
const logger_1 = require("../utils/logger");
/**
 * Risk Scoring Service
 * Calculates comprehensive risk scores for buyers based on various factors
 */
class RiskScoringService {
    /**
     * Calculate comprehensive risk score for a buyer
     */
    async calculateRiskScore(pool, buyerId) {
        try {
            logger_1.logger.info(`Calculating risk score for buyer ${buyerId}`);
            const buyer = await this.getBuyerDetails(pool, buyerId);
            if (!buyer)
                throw new Error(`Buyer ${buyerId} not found`);
            const verificationHistory = await this.getVerificationHistory(pool, buyerId);
            const transactionHistory = await this.getTransactionHistory(pool, buyerId);
            const creditRisk = this.calculateCreditRisk(verificationHistory);
            const complianceRisk = this.calculateComplianceRisk(verificationHistory);
            const transactionRisk = this.calculateTransactionRisk(transactionHistory);
            const geographicRisk = this.calculateGeographicRisk(buyer);
            const industryRisk = this.calculateIndustryRisk(buyer);
            const weights = {
                credit: 0.30,
                compliance: 0.25,
                transaction: 0.20,
                geographic: 0.15,
                industry: 0.10,
            };
            const overallScore = creditRisk.score * weights.credit +
                complianceRisk.score * weights.compliance +
                transactionRisk.score * weights.transaction +
                geographicRisk.score * weights.geographic +
                industryRisk.score * weights.industry;
            const riskLevel = this.determineRiskLevel(overallScore);
            const components = {
                credit: creditRisk,
                compliance: complianceRisk,
                transaction: transactionRisk,
                geographic: geographicRisk,
                industry: industryRisk,
            };
            const result = {
                buyerId,
                overallScore: Math.round(overallScore),
                riskLevel,
                components,
                weights,
                calculatedAt: new Date().toISOString(),
                recommendations: this.generateRecommendations(overallScore, components),
            };
            await this.saveRiskScore(pool, result);
            return result;
        }
        catch (error) {
            logger_1.logger.error('Risk scoring calculation error:', error);
            throw error;
        }
    }
    // ─── DB helpers ────────────────────────────────────────────────────────────
    async getBuyerDetails(pool, buyerId) {
        const result = await pool.query('SELECT * FROM buyer_registry WHERE buyer_id = $1', [buyerId]);
        return result.rows[0];
    }
    async getVerificationHistory(pool, buyerId) {
        const result = await pool.query(`SELECT * FROM buyer_verification_records
       WHERE buyer_id = $1 ORDER BY created_at DESC`, [buyerId]);
        return result.rows;
    }
    async getTransactionHistory(pool, buyerId) {
        const result = await pool.query(`SELECT * FROM export_contracts
       WHERE buyer_id = $1 ORDER BY created_at DESC LIMIT 50`, [buyerId]);
        return result.rows;
    }
    // ─── Risk calculators ──────────────────────────────────────────────────────
    calculateCreditRisk(verificationHistory) {
        const creditChecks = verificationHistory.filter((v) => v.verification_type === 'CREDIT_CHECK');
        if (creditChecks.length === 0) {
            return { score: 70, level: 'MEDIUM', reason: 'No credit check available' };
        }
        const creditScore = creditChecks[0].score ?? 50;
        let riskScore;
        if (creditScore >= 90)
            riskScore = 10;
        else if (creditScore >= 80)
            riskScore = 20;
        else if (creditScore >= 70)
            riskScore = 40;
        else if (creditScore >= 60)
            riskScore = 60;
        else
            riskScore = 80;
        return {
            score: riskScore,
            level: this.scoreToLevel(riskScore),
            creditScore,
            reason: `Credit score: ${creditScore}`,
        };
    }
    calculateComplianceRisk(verificationHistory) {
        const sanctionsChecks = verificationHistory.filter((v) => v.verification_type === 'SANCTIONS_SCREENING');
        if (sanctionsChecks.length === 0) {
            return { score: 80, level: 'HIGH', reason: 'No sanctions screening available' };
        }
        const latest = sanctionsChecks[0];
        if (latest.status === 'FAILED') {
            return { score: 95, level: 'CRITICAL', reason: 'Failed sanctions screening' };
        }
        else if (latest.status === 'PASSED') {
            return { score: 5, level: 'LOW', reason: 'Passed sanctions screening' };
        }
        return { score: 50, level: 'MEDIUM', reason: 'Sanctions screening pending' };
    }
    calculateTransactionRisk(transactionHistory) {
        if (transactionHistory.length === 0) {
            return { score: 60, level: 'MEDIUM', reason: 'No transaction history' };
        }
        const total = transactionHistory.length;
        const successful = transactionHistory.filter((t) => t.status === 'COMPLETED').length;
        const failed = transactionHistory.filter((t) => t.status === 'CANCELLED' || t.status === 'FAILED').length;
        const successRate = total > 0 ? (successful / total) * 100 : 0;
        let riskScore;
        if (successRate >= 95)
            riskScore = 10;
        else if (successRate >= 85)
            riskScore = 20;
        else if (successRate >= 75)
            riskScore = 40;
        else if (successRate >= 60)
            riskScore = 60;
        else
            riskScore = 80;
        return {
            score: riskScore,
            level: this.scoreToLevel(riskScore),
            successRate,
            totalTransactions: total,
            successfulTransactions: successful,
            failedTransactions: failed,
            reason: `${successRate.toFixed(1)}% success rate over ${total} transactions`,
        };
    }
    calculateGeographicRisk(buyer) {
        const countryRiskScores = {
            US: 10, CA: 10, GB: 10, DE: 10, FR: 10, AU: 10,
            JP: 15, KR: 15, SG: 15, NL: 15, CH: 15,
            BR: 30, MX: 30, IN: 30, ZA: 30, TR: 30,
            CN: 40, RU: 40, EG: 40, NG: 40, PK: 40,
            AF: 90, IQ: 90, SY: 90, YE: 90, SO: 90,
        };
        const countryCode = buyer.country || 'UNKNOWN';
        const riskScore = countryRiskScores[countryCode] ?? 50;
        return {
            score: riskScore,
            level: this.scoreToLevel(riskScore),
            country: countryCode,
            reason: `Geographic risk for ${countryCode}`,
        };
    }
    calculateIndustryRisk(buyer) {
        const industryRiskScores = {
            FOOD_BEVERAGE: 15,
            RETAIL: 20,
            MANUFACTURING: 25,
            TECHNOLOGY: 20,
            FINANCE: 30,
            ENERGY: 40,
            MINING: 50,
            DEFENSE: 60,
            GAMBLING: 70,
            CRYPTOCURRENCY: 80,
        };
        const industry = buyer.industry || 'UNKNOWN';
        const riskScore = industryRiskScores[industry] ?? 30;
        return {
            score: riskScore,
            level: this.scoreToLevel(riskScore),
            industry,
            reason: `Industry risk for ${industry}`,
        };
    }
    // ─── Utilities ─────────────────────────────────────────────────────────────
    scoreToLevel(score) {
        if (score <= 20)
            return 'LOW';
        if (score <= 40)
            return 'MEDIUM';
        if (score <= 70)
            return 'HIGH';
        return 'CRITICAL';
    }
    determineRiskLevel(score) {
        return this.scoreToLevel(score);
    }
    generateRecommendations(overallScore, components) {
        const recommendations = [];
        if (overallScore >= 70) {
            recommendations.push('REJECT: High risk buyer - recommend declining transaction');
        }
        else if (overallScore >= 40) {
            recommendations.push('REVIEW: Medium risk buyer - requires manual review');
            recommendations.push('Consider additional verification or collateral');
        }
        else {
            recommendations.push('APPROVE: Low risk buyer - can proceed with standard terms');
        }
        if (components.credit.score >= 60) {
            recommendations.push('Require credit insurance or letter of credit');
        }
        if (components.compliance.score >= 50) {
            recommendations.push('Enhanced due diligence required');
        }
        if (components.transaction.score >= 50) {
            recommendations.push('Review transaction history and payment terms');
        }
        if (components.geographic.score >= 50) {
            recommendations.push('Consider country-specific risk mitigation');
        }
        return recommendations;
    }
    /**
     * Save risk score to database
     */
    async saveRiskScore(pool, result) {
        await pool.query(`INSERT INTO buyer_risk_scores (
         buyer_id, overall_score, risk_level, components,
         recommendations, calculated_at
       ) VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (buyer_id)
       DO UPDATE SET
         overall_score = EXCLUDED.overall_score,
         risk_level = EXCLUDED.risk_level,
         components = EXCLUDED.components,
         recommendations = EXCLUDED.recommendations,
         calculated_at = EXCLUDED.calculated_at`, [
            result.buyerId,
            result.overallScore,
            result.riskLevel,
            JSON.stringify(result.components),
            JSON.stringify(result.recommendations),
            result.calculatedAt,
        ]);
    }
}
exports.RiskScoringService = RiskScoringService;
exports.default = new RiskScoringService();
//# sourceMappingURL=risk-scoring.service.js.map