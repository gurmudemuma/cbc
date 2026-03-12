const logger = require('../utils/logger');

/**
 * Risk Scoring Service
 * Calculates comprehensive risk scores for buyers based on various factors
 */

class RiskScoringService {
  
  /**
   * Calculate comprehensive risk score for a buyer
   * @param {Pool} pool - Database connection pool
   * @param {string} buyerId - Buyer ID
   * @returns {Object} Risk score and breakdown
   */
  async calculateRiskScore(pool, buyerId) {
    try {
      logger.info(`Calculating risk score for buyer ${buyerId}`);
      
      // Get buyer details and verification history
      const buyer = await this.getBuyerDetails(pool, buyerId);
      if (!buyer) {
        throw new Error(`Buyer ${buyerId} not found`);
      }
      
      const verificationHistory = await this.getVerificationHistory(pool, buyerId);
      const transactionHistory = await this.getTransactionHistory(pool, buyerId);
      
      // Calculate individual risk components
      const creditRisk = this.calculateCreditRisk(verificationHistory);
      const complianceRisk = this.calculateComplianceRisk(verificationHistory);
      const transactionRisk = this.calculateTransactionRisk(transactionHistory);
      const geographicRisk = this.calculateGeographicRisk(buyer);
      const industryRisk = this.calculateIndustryRisk(buyer);
      
      // Calculate overall risk score (weighted average)
      const weights = {
        credit: 0.30,
        compliance: 0.25,
        transaction: 0.20,
        geographic: 0.15,
        industry: 0.10
      };
      
      const overallScore = (
        creditRisk.score * weights.credit +
        complianceRisk.score * weights.compliance +
        transactionRisk.score * weights.transaction +
        geographicRisk.score * weights.geographic +
        industryRisk.score * weights.industry
      );
      
      const riskLevel = this.determineRiskLevel(overallScore);
      
      const result = {
        buyerId,
        overallScore: Math.round(overallScore),
        riskLevel,
        components: {
          credit: creditRisk,
          compliance: complianceRisk,
          transaction: transactionRisk,
          geographic: geographicRisk,
          industry: industryRisk
        },
        weights,
        calculatedAt: new Date().toISOString(),
        recommendations: this.generateRecommendations(overallScore, {
          credit: creditRisk,
          compliance: complianceRisk,
          transaction: transactionRisk,
          geographic: geographicRisk,
          industry: industryRisk
        })
      };
      
      // Save risk score to database
      await this.saveRiskScore(pool, result);
      
      return result;
      
    } catch (error) {
      logger.error('Risk scoring calculation error:', error);
      throw error;
    }
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
   * Get verification history for buyer
   */
  async getVerificationHistory(pool, buyerId) {
    const query = `
      SELECT * FROM buyer_verification_records 
      WHERE buyer_id = $1 
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [buyerId]);
    return result.rows;
  }
  
  /**
   * Get transaction history for buyer
   */
  async getTransactionHistory(pool, buyerId) {
    const query = `
      SELECT * FROM export_contracts 
      WHERE buyer_id = $1 
      ORDER BY created_at DESC 
      LIMIT 50
    `;
    const result = await pool.query(query, [buyerId]);
    return result.rows;
  }
  
  /**
   * Calculate credit risk score (0-100, lower is better)
   */
  calculateCreditRisk(verificationHistory) {
    const creditChecks = verificationHistory.filter(v => v.verification_type === 'CREDIT_CHECK');
    
    if (creditChecks.length === 0) {
      return {
        score: 70, // Medium risk if no credit check
        level: 'MEDIUM',
        reason: 'No credit check available'
      };
    }
    
    const latestCreditCheck = creditChecks[0];
    const creditScore = latestCreditCheck.score || 50;
    
    // Convert credit score to risk score (inverse relationship)
    let riskScore;
    if (creditScore >= 90) riskScore = 10;
    else if (creditScore >= 80) riskScore = 20;
    else if (creditScore >= 70) riskScore = 40;
    else if (creditScore >= 60) riskScore = 60;
    else riskScore = 80;
    
    return {
      score: riskScore,
      level: this.scoreToLevel(riskScore),
      creditScore,
      reason: `Credit score: ${creditScore}`
    };
  }
  
  /**
   * Calculate compliance risk score
   */
  calculateComplianceRisk(verificationHistory) {
    const sanctionsChecks = verificationHistory.filter(v => v.verification_type === 'SANCTIONS_SCREENING');
    
    if (sanctionsChecks.length === 0) {
      return {
        score: 80, // High risk if no sanctions check
        level: 'HIGH',
        reason: 'No sanctions screening available'
      };
    }
    
    const latestSanctionsCheck = sanctionsChecks[0];
    
    if (latestSanctionsCheck.status === 'FAILED') {
      return {
        score: 95,
        level: 'CRITICAL',
        reason: 'Failed sanctions screening'
      };
    } else if (latestSanctionsCheck.status === 'PASSED') {
      return {
        score: 5,
        level: 'LOW',
        reason: 'Passed sanctions screening'
      };
    } else {
      return {
        score: 50,
        level: 'MEDIUM',
        reason: 'Sanctions screening pending'
      };
    }
  }
  
  /**
   * Calculate transaction risk score
   */
  calculateTransactionRisk(transactionHistory) {
    if (transactionHistory.length === 0) {
      return {
        score: 60,
        level: 'MEDIUM',
        reason: 'No transaction history'
      };
    }
    
    const totalTransactions = transactionHistory.length;
    const successfulTransactions = transactionHistory.filter(t => t.status === 'COMPLETED').length;
    const failedTransactions = transactionHistory.filter(t => t.status === 'CANCELLED' || t.status === 'FAILED').length;
    
    const successRate = totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0;
    
    let riskScore;
    if (successRate >= 95) riskScore = 10;
    else if (successRate >= 85) riskScore = 20;
    else if (successRate >= 75) riskScore = 40;
    else if (successRate >= 60) riskScore = 60;
    else riskScore = 80;
    
    return {
      score: riskScore,
      level: this.scoreToLevel(riskScore),
      successRate,
      totalTransactions,
      successfulTransactions,
      failedTransactions,
      reason: `${successRate.toFixed(1)}% success rate over ${totalTransactions} transactions`
    };
  }
  
  /**
   * Calculate geographic risk score
   */
  calculateGeographicRisk(buyer) {
    // Risk scores by country/region (simplified example)
    const countryRiskScores = {
      'US': 10, 'CA': 10, 'GB': 10, 'DE': 10, 'FR': 10, 'AU': 10,
      'JP': 15, 'KR': 15, 'SG': 15, 'NL': 15, 'CH': 15,
      'BR': 30, 'MX': 30, 'IN': 30, 'ZA': 30, 'TR': 30,
      'CN': 40, 'RU': 40, 'EG': 40, 'NG': 40, 'PK': 40,
      'AF': 90, 'IQ': 90, 'SY': 90, 'YE': 90, 'SO': 90
    };
    
    const countryCode = buyer.country || 'UNKNOWN';
    const riskScore = countryRiskScores[countryCode] || 50; // Default medium risk
    
    return {
      score: riskScore,
      level: this.scoreToLevel(riskScore),
      country: countryCode,
      reason: `Geographic risk for ${countryCode}`
    };
  }
  
  /**
   * Calculate industry risk score
   */
  calculateIndustryRisk(buyer) {
    // Risk scores by industry (simplified example)
    const industryRiskScores = {
      'FOOD_BEVERAGE': 15,
      'RETAIL': 20,
      'MANUFACTURING': 25,
      'TECHNOLOGY': 20,
      'FINANCE': 30,
      'ENERGY': 40,
      'MINING': 50,
      'DEFENSE': 60,
      'GAMBLING': 70,
      'CRYPTOCURRENCY': 80
    };
    
    const industry = buyer.industry || 'UNKNOWN';
    const riskScore = industryRiskScores[industry] || 30; // Default low-medium risk
    
    return {
      score: riskScore,
      level: this.scoreToLevel(riskScore),
      industry,
      reason: `Industry risk for ${industry}`
    };
  }
  
  /**
   * Convert numeric score to risk level
   */
  scoreToLevel(score) {
    if (score <= 20) return 'LOW';
    if (score <= 40) return 'MEDIUM';
    if (score <= 70) return 'HIGH';
    return 'CRITICAL';
  }
  
  /**
   * Determine overall risk level
   */
  determineRiskLevel(score) {
    return this.scoreToLevel(score);
  }
  
  /**
   * Generate recommendations based on risk assessment
   */
  generateRecommendations(overallScore, components) {
    const recommendations = [];
    
    if (overallScore >= 70) {
      recommendations.push('REJECT: High risk buyer - recommend declining transaction');
    } else if (overallScore >= 40) {
      recommendations.push('REVIEW: Medium risk buyer - requires manual review');
      recommendations.push('Consider additional verification or collateral');
    } else {
      recommendations.push('APPROVE: Low risk buyer - can proceed with standard terms');
    }
    
    // Component-specific recommendations
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
  async saveRiskScore(pool, riskScoreResult) {
    const query = `
      INSERT INTO buyer_risk_scores (
        buyer_id, overall_score, risk_level, components, 
        recommendations, calculated_at
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (buyer_id) 
      DO UPDATE SET 
        overall_score = EXCLUDED.overall_score,
        risk_level = EXCLUDED.risk_level,
        components = EXCLUDED.components,
        recommendations = EXCLUDED.recommendations,
        calculated_at = EXCLUDED.calculated_at
    `;
    
    await pool.query(query, [
      riskScoreResult.buyerId,
      riskScoreResult.overallScore,
      riskScoreResult.riskLevel,
      JSON.stringify(riskScoreResult.components),
      JSON.stringify(riskScoreResult.recommendations),
      riskScoreResult.calculatedAt
    ]);
  }
}

module.exports = new RiskScoringService();