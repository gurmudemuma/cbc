// Simple Node.js API test to verify basic functionality
const express = require('express');
const app = express();

const PORT = process.env.PORT || 3001;

app.use(express.json());

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'Simple Test API',
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

app.get('/', (req, res) => {
    res.json({
        message: 'Simple API is working!',
        port: PORT
    });
});

app.listen(PORT, () => {
    console.log(`Simple test API running on port ${PORT}`);
    console.log(`Test it: curl http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    process.exit(0);
});
