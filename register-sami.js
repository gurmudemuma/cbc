/**
 * Script to register and approve user "sami"
 * This will create the user on both blockchain and database
 */

const axios = require('axios');
const bcrypt = require('bcryptjs');

const GATEWAY_URL = 'http://localhost:3000';

async function registerAndApproveSami() {
  console.log('=== Registering and Approving User: sami ===\n');

  try {
    // Step 1: Register the user
    console.log('Step 1: Registering user "sami"...');
    const registrationData = {
      username: 'sami',
      password: 'password123',
      email: 'sami@example.com',
      phone: '+251911234567',
      companyName: 'Sami Coffee Exports',
      tin: 'TIN_SAMI_2024',
      capitalETB: 50000000, // 50 million ETB (minimum for private exporter)
      address: 'Addis Ababa, Ethiopia',
      contactPerson: 'Sami Ahmed',
      businessType: 'PRIVATE_EXPORTER'
    };

    try {
      const registerResponse = await axios.post(
        `${GATEWAY_URL}/api/auth/register`,
        registrationData
      );
      console.log('✓ Registration successful:', registerResponse.data);
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.error?.includes('already exists')) {
        console.log('⚠ User already exists, skipping registration');
      } else {
        throw error;
      }
    }

    // Step 2: Login as ECTA admin to approve the user
    console.log('\nStep 2: Logging in as ECTA admin...');
    const loginResponse = await axios.post(
      `${GATEWAY_URL}/api/auth/login`,
      {
        username: 'ecta1',
        password: 'password123'
      }
    );
    const ectaToken = loginResponse.data.token;
    console.log('✓ ECTA admin logged in');

    // Step 3: Approve the user
    console.log('\nStep 3: Approving user "sami"...');
    try {
      const approvalResponse = await axios.post(
        `${GATEWAY_URL}/api/exporter/approve`,
        {
          username: 'sami',
          status: 'approved',
          comments: 'Approved by ECTA - All requirements met'
        },
        {
          headers: {
            'Authorization': `Bearer ${ectaToken}`
          }
        }
      );
      console.log('✓ User approved:', approvalResponse.data);
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('⚠ Approval endpoint not found, trying alternative...');
        
        // Try alternative approval endpoint
        const altApprovalResponse = await axios.put(
          `${GATEWAY_URL}/api/ecta/users/sami/status`,
          {
            status: 'approved',
            approvedBy: 'ecta1',
            comments: 'Approved by ECTA - All requirements met'
          },
          {
            headers: {
              'Authorization': `Bearer ${ectaToken}`
            }
          }
        );
        console.log('✓ User approved (alternative):', altApprovalResponse.data);
      } else {
        throw error;
      }
    }

    // Step 4: Verify the user can login
    console.log('\nStep 4: Verifying user "sami" can login...');
    const samiLoginResponse = await axios.post(
      `${GATEWAY_URL}/api/auth/login`,
      {
        username: 'sami',
        password: 'password123'
      }
    );
    console.log('✓ User "sami" can login successfully!');
    console.log('  Token:', samiLoginResponse.data.token.substring(0, 50) + '...');
    console.log('  User:', samiLoginResponse.data.user);

    console.log('\n=== SUCCESS ===');
    console.log('User "sami" has been registered, approved, and can now login!');
    console.log('\nLogin credentials:');
    console.log('  Username: sami');
    console.log('  Password: password123');

  } catch (error) {
    console.error('\n=== ERROR ===');
    console.error('Error:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

registerAndApproveSami();
