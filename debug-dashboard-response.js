// Simple script to fetch and display the exact dashboard response
const axios = require('axios');
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { id: 'exporter1', role: 'exporter' },
  '8f2a9b7c6d5e4f3a2b1c9d8e7f6a5b4c3d2e1f9a8b7c6d5e4f3a2b1c9d8e7f6a5b4c3d2e1f',
  { expiresIn: '1h' }
);

axios.get('http://localhost:3000/api/exporter/dashboard', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(response => {
  console.log('=== RAW RESPONSE ===');
  console.log(JSON.stringify(response.data, null, 2));
})
.catch(error => {
  console.error('Error:', error.response?.data || error.message);
});
