const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const API_URLS = [
  'http://localhost:3001/api/auth/register',
  'http://localhost:3002/api/auth/register',
  'http://localhost:3003/api/auth/register',
  'http://localhost:3004/api/auth/register'
];

const loadEnv = () => {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
  }
};

loadEnv();

const newUser = {
  username: process.env.TEST_USERNAME || 'testuser' + Date.now(),
  password: process.env.TEST_PASSWORD || crypto.randomBytes(16).toString('hex'),
  email: process.env.TEST_EMAIL || `test${Date.now()}@example.com`,
};

async function registerUser() {
  console.log(`Attempting to register user '${newUser.username}' across all services...`);
  
  let allSuccessful = true;
  const results = [];

  for (const apiUrl of API_URLS) {
    let attempts = 0;
    let success = false;
    while (attempts < 3 && !success) {
      try {
        const response = await axios.post(apiUrl, newUser, {
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.data && response.data.success) {
          results.push(`✅ Success for ${apiUrl}`);
          success = true;
        } else {
          results.push(`❌ Failed for ${apiUrl}: ${JSON.stringify(response.data)}`);
          allSuccessful = false;
        }
      } catch (error) {
        let errorMsg = error.message;
        if (error.response) {
          errorMsg = `Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`;
          if (error.response.status === 429) {
            console.log(`Rate limit hit for ${apiUrl}. Retrying after 15 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 15000));
            attempts++;
            continue;
          }
        }
        results.push(`❌ Error for ${apiUrl}: ${errorMsg}`);
        allSuccessful = false;
      }
    }
    if (!success) {
      results.push(`❌ Failed after retries for ${apiUrl}`);
    }
  }

  // Output results
  results.forEach(result => console.log(result));

  if (allSuccessful) {
    console.log('\n✅ All registrations successful!');
    console.log('Please log in with the following credentials on any service:');
    console.log(`   Username: ${newUser.username}`);
    console.log(`   Password: ${newUser.password}`);
    console.log(`   Email: ${newUser.email}`);
  } else {
    console.log('\n⚠️ Some registrations failed. See details above.');
    console.log('Please ensure all APIs are running on their respective ports (3001-3004).');
  }
}

registerUser();