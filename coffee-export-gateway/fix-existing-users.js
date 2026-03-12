/**
 * Fix existing users with corrupted password hashes on blockchain
 * This updates the blockchain password hash to match PostgreSQL
 */

const { Pool } = require('pg');
const { execSync } = require('child_process');

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: 'coffee_export_db',
  user: 'postgres',
  password: 'postgres'
});

async function fixUser(username) {
  try {
    // Get password hash from PostgreSQL
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE username = $1',
      [username]
    );
    
    if (result.rows.length === 0) {
      console.log(`User ${username} not found in PostgreSQL`);
      return false;
    }
    
    const correctPasswordHash = result.rows[0].password_hash;
    console.log(`\nFixing user: ${username}`);
    console.log(`Correct hash: ${correctPasswordHash.substring(0, 20)}...`);
    
    // Update on blockchain using UpdateUserStatus
    const updateData = {
      passwordHash: correctPasswordHash
    };
    
    const argsJson = JSON.stringify({
      Args: ['UpdateUserStatus', username, JSON.stringify(updateData)]
    });
    
    // Escape for shell (including $ signs)
    const escapedJson = argsJson
      .replace(/\\/g, '\\\\')
      .replace(/\$/g, '\\$')
      .replace(/"/g, '\\"')
      .replace(/`/g, '\\`');
    
    const cmd = `docker exec cli sh -c 'peer chaincode invoke -C coffeechannel -n ecta -c "${escapedJson}" -o orderer1.orderer.example.com:7050 --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem --peerAddresses peer0.ecta.example.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt --peerAddresses peer0.bank.example.com:9051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt --peerAddresses peer0.nbe.example.com:10051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt 2>&1'`;
    
    const output = execSync(cmd, { encoding: 'utf8' });
    
    if (output.includes('Chaincode invoke successful')) {
      console.log(`✓ Password hash updated on blockchain for ${username}`);
      return true;
    } else {
      console.log(`✗ Failed to update ${username}:`, output);
      return false;
    }
  } catch (error) {
    console.error(`Error fixing ${username}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('=== Fixing Existing Users with Corrupted Password Hashes ===\n');
  
  try {
    // Get all exporters from PostgreSQL
    const result = await pool.query(
      "SELECT username FROM users WHERE role = 'exporter' AND is_active = true ORDER BY username"
    );
    
    console.log(`Found ${result.rows.length} active exporters to fix\n`);
    
    let fixed = 0;
    for (const row of result.rows) {
      const success = await fixUser(row.username);
      if (success) fixed++;
      
      // Wait a bit between updates
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log(`\n=== Complete: Fixed ${fixed} of ${result.rows.length} users ===`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

main();
