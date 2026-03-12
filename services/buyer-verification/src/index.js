const express = require('express');
const { Pool } = require('pg');
const verificationService = require('./services/verification.service');
const riskScoringService = require('./services/risk-scoring.service');
const logger = require('./utils/logger');

require('dotenv').config();

const app = express();
app.use(express.json());

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'coffee_export_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'buyer-verification' });
});

// Verify buyer
app.post('/api/verify/buyer/:buyerId', async (req, res) => {
  try {
    const { buyerId } = req.params;
    const { verificationType } = req.body;
    
    logger.info(`Starting verification for buyer ${buyerId}, type: ${verificationType}`);
    
    const result = await verificationService.verifyBuyer(pool, buyerId, verificationType);
    
    res.json({
      success: true,
      buyerId,
      verificationType,
      result
    });
  } catch (error) {
    logger.error('Verification error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Calculate risk score
app.post('/api/risk-score/:buyerId', async (req, res) => {
  try {
    const { buyerId } = req.params;
    
    logger.info(`Calculating risk score for buyer ${buyerId}`);
    
    const riskScore = await riskScoringService.calculateRiskScore(pool, buyerId);
    
    res.json({
      success: true,
      buyerId,
      riskScore
    });
  } catch (error) {
    logger.error('Risk scoring error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3009;
app.listen(PORT, () => {
  logger.info(`Buyer Verification Service running on port ${PORT}`);
});
