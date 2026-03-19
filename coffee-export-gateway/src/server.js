require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { router: authRouter } = require('./routes/auth.routes');
const exporterRouter = require('./routes/exporter.routes');
const exportsRouter = require('./routes/exports.routes');
const eswRouter = require('./routes/esw.routes');
const certificatesRouter = require('./routes/certificates.routes');
const ectaRouter = require('./routes/ecta.routes');
const statutoryRouter = require('./routes/statutory.routes');
const shipmentRouter = require('./routes/shipment.routes');
const documentsRouter = require('./routes/documents.routes');
const inspectionsRouter = require('./routes/inspections.routes');
// Phase 4: Customs & Logistics routes
const customsRouter = require('./routes/customs.routes');
const shippingRouter = require('./routes/shipping.routes');
const containerRouter = require('./routes/container.routes');
const vesselRouter = require('./routes/vessel.routes');
// Analytics routes (PostgreSQL optimization)
const analyticsRouter = require('./routes/analytics.routes');
// Sales Contract routes
const buyersRouter = require('./routes/buyers.routes');
const marketplaceRouter = require('./routes/marketplace.routes');
const contractDraftsRouter = require('./routes/contract-drafts.routes');
const legalRouter = require('./routes/legal.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting errors when behind proxy
  skipFailedRequests: false,
  skipSuccessfulRequests: false,
  // Trust proxy to get real IP
  validate: { xForwardedForHeader: false }
});
app.use(limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api/exporter', exporterRouter);
app.use('/api/preregistration', exporterRouter); // Frontend-compatible path for certificate downloads
app.use('/api/exports', exportsRouter);
app.use('/api/esw', eswRouter);
app.use('/api/certificates', certificatesRouter);
app.use('/api/ecta', ectaRouter);
app.use('/api/statutory', statutoryRouter);
app.use('/api/shipment', shipmentRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/inspections', inspectionsRouter);
// Phase 4: Customs & Logistics routes
app.use('/api/customs', customsRouter);
app.use('/api/shipping', shippingRouter);
app.use('/api/container', containerRouter);
app.use('/api/vessel', vesselRouter);
// Analytics routes (PostgreSQL-powered)
app.use('/api/analytics', analyticsRouter);
// Sales Contract routes
app.use('/api/buyers', buyersRouter);
app.use('/api/marketplace', marketplaceRouter);
app.use('/api/contracts/drafts', contractDraftsRouter);
app.use('/api/legal', legalRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Coffee Export Gateway running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Channel: ${process.env.CHANNEL_NAME || 'coffeechannel'}`);
  console.log(`Chaincode: ${process.env.CHAINCODE_NAME || 'ecta'}`);
});

module.exports = app;
