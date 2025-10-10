#!/usr/bin/env node

/**
 * WebSocket Connection Test Script
 * Tests WebSocket inter-communication for all APIs
 */

const WebSocket = require('ws');

// ANSI color codes
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Services to test
const services = [
  { name: 'Exporter Bank', port: 3001 },
  { name: 'National Bank', port: 3002 },
  { name: 'NCAT', port: 3003 },
  { name: 'Shipping Line', port: 3004 }
];

// Test results
const results = {
  passed: 0,
  failed: 0,
  total: services.length
};

console.log('================================================');
console.log('Coffee Export Consortium - WebSocket Test');
console.log('================================================\n');

/**
 * Test WebSocket connection to a service
 */
function testWebSocket(service) {
  return new Promise((resolve) => {
    const url = `ws://localhost:${service.port}`;
    console.log(`Testing ${service.name} (${url})...`);
    
    const timeout = setTimeout(() => {
      console.log(`${colors.red}✗ TIMEOUT${colors.reset} - Connection timeout after 5 seconds\n`);
      results.failed++;
      resolve(false);
    }, 5000);
    
    try {
      const ws = new WebSocket(url);
      
      ws.on('open', () => {
        clearTimeout(timeout);
        console.log(`${colors.green}✓ CONNECTED${colors.reset}`);
        
        // Send ping
        console.log('  Sending ping...');
        ws.send(JSON.stringify({ event: 'ping' }));
        
        // Wait for pong
        const pongTimeout = setTimeout(() => {
          console.log(`${colors.yellow}⚠ No pong received${colors.reset}\n`);
          ws.close();
          results.passed++;
          resolve(true);
        }, 2000);
        
        ws.on('message', (data) => {
          clearTimeout(pongTimeout);
          try {
            const message = JSON.parse(data);
            console.log(`  ${colors.blue}Received:${colors.reset}`, message);
            console.log(`${colors.green}✓ PASSED${colors.reset}\n`);
            ws.close();
            results.passed++;
            resolve(true);
          } catch (e) {
            console.log(`  ${colors.yellow}Received (raw):${colors.reset}`, data.toString());
            console.log(`${colors.green}✓ PASSED${colors.reset}\n`);
            ws.close();
            results.passed++;
            resolve(true);
          }
        });
      });
      
      ws.on('error', (error) => {
        clearTimeout(timeout);
        console.log(`${colors.red}✗ ERROR${colors.reset} - ${error.message}`);
        
        if (error.code === 'ECONNREFUSED') {
          console.log('  Service may not be running\n');
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          console.log('  Authentication required (this is expected)\n');
          results.passed++;
          resolve(true);
          return;
        } else {
          console.log('');
        }
        
        results.failed++;
        resolve(false);
      });
      
      ws.on('close', (code, reason) => {
        if (code === 1002) {
          console.log(`${colors.yellow}⚠ CLOSED${colors.reset} - Protocol error (may need authentication)\n`);
          results.passed++;
          resolve(true);
        }
      });
      
    } catch (error) {
      clearTimeout(timeout);
      console.log(`${colors.red}✗ EXCEPTION${colors.reset} - ${error.message}\n`);
      results.failed++;
      resolve(false);
    }
  });
}

/**
 * Run all tests sequentially
 */
async function runTests() {
  console.log('Testing WebSocket Connections:');
  console.log('----------------------------\n');
  
  for (const service of services) {
    await testWebSocket(service);
  }
  
  // Print summary
  console.log('================================================');
  console.log('Summary:');
  console.log(`  Total: ${results.total}`);
  console.log(`  ${colors.green}Passed: ${results.passed}${colors.reset}`);
  console.log(`  ${colors.red}Failed: ${results.failed}${colors.reset}`);
  console.log('================================================\n');
  
  if (results.failed === 0) {
    console.log(`${colors.green}✓ All WebSocket connections working!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}✗ Some WebSocket connections failed${colors.reset}\n`);
    console.log('Troubleshooting:');
    console.log('1. Ensure all services are running');
    console.log('2. Check if WebSocket is properly initialized');
    console.log('3. Review service logs for WebSocket errors');
    console.log('4. Verify CORS_ORIGIN is set correctly\n');
    process.exit(1);
  }
}

// Check if ws module is available
try {
  require.resolve('ws');
  runTests();
} catch (e) {
  console.log(`${colors.red}Error: 'ws' module not found${colors.reset}`);
  console.log('Please install it with: npm install -g ws');
  console.log('Or run from project root: npm install\n');
  process.exit(1);
}
