require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { router: authRouter } = require('./routes/auth.routes');
const exporterRouter = require('./routes/exporter.routes');
const exportsRouter = require('./routes/exports.routes');
const networkRouter = require('./routes/network.routes');
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
const salesContractNetworkRouter = require('./routes/sales-contract-network.routes');
// Document Issuance routes
const documentRequestsRouter = require('./routes/document-requests.routes');
const documentIssuanceRouter = require('./routes/document-issuance.routes');
// NEW: Document Request Workflow routes
const documentRequestWorkflowRouter = require('./routes/document-request.routes');
// NEW: Agency Document Processing routes
const agencyDocumentProcessingRouter = require('./routes/agency-document-processing.routes');
// NEW: Document Verification Workflow routes
const documentVerificationRouter = require('./routes/document-verification.routes');
// Hybrid Data Service routes
const hybridRouter = require('./routes/hybrid.routes');
// Payment routes
const paymentsRouter = require('./routes/payments.routes');
const paymentsBankRouter = require('./routes/payments-bank.routes');
const paymentsNbeRouter = require('./routes/payments-nbe.routes');

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
  max: 1000, // limit each IP to 1000 requests per windowMs (increased for development)
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

// Prevent caching of API responses
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRouter);
// Document routes (must come before general /api/exporter route)
app.use('/api/exporter/documents', documentRequestsRouter); // Document requests for exporters
// NEW: Document Request Workflow (contract-based document requests)
app.use('/api/document-requests', documentRequestWorkflowRouter);
// NEW: Agency Document Processing
app.use('/api/agency', agencyDocumentProcessingRouter);
// NEW: Document Verification Workflow
app.use('/api/document-verification', documentVerificationRouter);
app.use('/api/exporter', exporterRouter);
app.use('/api/preregistration', exporterRouter); // Frontend-compatible path for certificate downloads
app.use('/api/exports', exportsRouter);
app.use('/api/network', networkRouter);
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
app.use('/api', salesContractNetworkRouter); // Sales Contract Network Approval routes

// ESW routes (backward compatibility - redirects to network routes)
app.use('/api/esw', networkRouter); // ESW endpoints now use network routes
app.use('/api/network', networkRouter); // Network endpoints (preferred naming)

// Document Issuance routes
app.use('/api/document-issuance', documentIssuanceRouter); // Document issuance endpoint

// Hybrid Data Service routes
app.use('/api/hybrid', hybridRouter); // Hybrid service management and monitoring
app.use('/api/network-member', documentIssuanceRouter); // Alternative path for backward compatibility

// Payment routes (specific routes first)
app.use('/api/payments/bank', paymentsBankRouter); // Bank payment endpoints
app.use('/api/payments/nbe', paymentsNbeRouter); // NBE FX approval endpoints
app.use('/api/payments', paymentsRouter); // Exporter payment endpoints

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
