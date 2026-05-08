"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
const verification_service_1 = __importDefault(require("./services/verification.service"));
const risk_scoring_service_1 = __importDefault(require("./services/risk-scoring.service"));
const logger_1 = require("./utils/logger");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Database connection
const pool = new pg_1.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'coffee_export_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
pool.on('error', (err) => {
    logger_1.logger.error('Unexpected error on idle client', err);
    process.exit(-1);
});
// ─── Health check ───────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({ status: 'healthy', service: 'buyer-verification' });
});
// ─── Verify buyer ───────────────────────────────────────────────────────────
app.post('/api/verify/buyer/:buyerId', async (req, res) => {
    try {
        const { buyerId } = req.params;
        const { verificationType } = req.body;
        logger_1.logger.info(`Starting verification for buyer ${buyerId}, type: ${verificationType ?? 'FULL'}`);
        const result = await verification_service_1.default.verifyBuyer(pool, buyerId, verificationType ?? 'FULL');
        res.json({ success: true, buyerId, verificationType, result });
    }
    catch (error) {
        logger_1.logger.error('Verification error:', error);
        res.status(500).json({ error: error.message });
    }
});
// ─── Calculate risk score ───────────────────────────────────────────────────
app.post('/api/risk-score/:buyerId', async (req, res) => {
    try {
        const { buyerId } = req.params;
        logger_1.logger.info(`Calculating risk score for buyer ${buyerId}`);
        const riskScore = await risk_scoring_service_1.default.calculateRiskScore(pool, buyerId);
        res.json({ success: true, buyerId, riskScore });
    }
    catch (error) {
        logger_1.logger.error('Risk scoring error:', error);
        res.status(500).json({ error: error.message });
    }
});
// ─── Graceful shutdown ──────────────────────────────────────────────────────
async function shutdown() {
    logger_1.logger.info('Shutting down Buyer Verification Service...');
    await pool.end();
    logger_1.logger.info('Shutdown complete');
    process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
// ─── Start server ───────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '3009');
app.listen(PORT, () => {
    logger_1.logger.info(`Buyer Verification Service running on port ${PORT}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map