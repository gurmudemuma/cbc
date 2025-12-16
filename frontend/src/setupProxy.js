const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use('/api/approvals', createProxyMiddleware({ target: 'http://localhost:3002', changeOrigin: true }));
  app.use('/api/fx-rates', createProxyMiddleware({ target: 'http://localhost:3002', changeOrigin: true }));
  app.use('/api/bookings', createProxyMiddleware({ target: 'http://localhost:3003', changeOrigin: true }));
  app.use('/api/quality', createProxyMiddleware({ target: 'http://localhost:3004', changeOrigin: true }));
  app.use('/api/contracts', createProxyMiddleware({ target: 'http://localhost:3005', changeOrigin: true }));
  app.use('/api/clearance', createProxyMiddleware({ target: 'http://localhost:3006', changeOrigin: true }));
  app.use('/api/documents', createProxyMiddleware({ target: 'http://localhost:3001', changeOrigin: true }));
  app.use('/api', createProxyMiddleware({ target: 'http://localhost:3001', changeOrigin: true }));
};
