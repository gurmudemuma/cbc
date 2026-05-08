import express, { Request, Response } from 'express';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import verificationService from './services/verification.service';
import riskScoringService from './services/risk-scoring.service';
import { logger } from './utils/logger';
import { VerificationType } from './types';

dotenv.config();

const app = express();
app.use(express.json());

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'coffee_export_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err: Error) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// ─── Health check ───────────────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response): void => {
  res.json({ status: 'healthy', service: 'buyer-verification' });
});

// ─── Verify buyer ───────────────────────────────────────────────────────────
app.post('/api/verify/buyer/:buyerId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { buyerId } = req.params;
    const { verificationType } = req.body as { verificationType?: VerificationType };

    logger.info(
      `Starting verification for buyer ${buyerId}, type: ${verificationType ?? 'FULL'}`,
    );

    const result = await verificationService.verifyBuyer(
      pool,
      buyerId,
      verificationType ?? 'FULL',
    );

    res.json({ success: true, buyerId, verificationType, result });
  } catch (error) {
    logger.error('Verification error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// ─── Calculate risk score ───────────────────────────────────────────────────
app.post('/api/risk-score/:buyerId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { buyerId } = req.params;

    logger.info(`Calculating risk score for buyer ${buyerId}`);

    const riskScore = await riskScoringService.calculateRiskScore(pool, buyerId);

    res.json({ success: true, buyerId, riskScore });
  } catch (error) {
    logger.error('Risk scoring error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// ─── Graceful shutdown ──────────────────────────────────────────────────────
async function shutdown(): Promise<void> {
  logger.info('Shutting down Buyer Verification Service...');
  await pool.end();
  logger.info('Shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// ─── Start server ───────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '3009');
app.listen(PORT, () => {
  logger.info(`Buyer Verification Service running on port ${PORT}`);
});

export default app;
