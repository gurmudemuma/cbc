@echo off
REM ============================================================================
REM ENROLL ADMIN IDENTITIES FOR BLOCKCHAIN BRIDGE
REM Creates wallet identities for all organizations
REM ============================================================================

setlocal enabledelayedexpansion

echo.
echo ============================================================================
echo              ENROLLING ADMIN IDENTITIES
echo ============================================================================
echo.

set CRYPTO_PATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config

REM ============================================================================
REM ENROLL ECTA ADMIN
REM ============================================================================
echo [1/5] Enrolling ECTA Admin...
docker exec cli node -e "
const FabricCAServices = require('fabric-ca-client');
const { Wallets, X509Identity } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function enrollAdmin() {
  try {
    // Load crypto materials
    const ccpPath = '/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/ecta.example.com';
    const certPath = path.join(ccpPath, 'users/Admin@ecta.example.com/msp/signcerts/Admin@ecta.example.com-cert.pem');
    const keyPath = path.join(ccpPath, 'users/Admin@ecta.example.com/msp/keystore');
    
    const cert = fs.readFileSync(certPath).toString();
    const keyFiles = fs.readdirSync(keyPath);
    const keyPEM = fs.readFileSync(path.join(keyPath, keyFiles[0])).toString();
    
    // Create wallet
    const walletPath = path.join('/opt/gopath/src/github.com/hyperledger/fabric/peer', 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    
    // Create identity
    const identity = {
      credentials: {
        certificate: cert,
        privateKey: keyPEM,
      },
      mspId: 'ECTAMSP',
      type: 'X.509',
    };
    
    await wallet.put('admin', identity);
    console.log('Successfully enrolled ECTA admin');
  } catch (error) {
    console.error('Failed to enroll admin:', error);
    process.exit(1);
  }
}

enrollAdmin();
" >nul 2>&1

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] ECTA Admin enrolled
) else (
    echo [WARNING] ECTA Admin enrollment failed
)
echo.

REM ============================================================================
REM ENROLL BANK ADMIN
REM ============================================================================
echo [2/5] Enrolling Bank Admin...
docker exec cli node -e "
const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function enrollAdmin() {
  try {
    const ccpPath = '/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/bank.example.com';
    const certPath = path.join(ccpPath, 'users/Admin@bank.example.com/msp/signcerts/Admin@bank.example.com-cert.pem');
    const keyPath = path.join(ccpPath, 'users/Admin@bank.example.com/msp/keystore');
    
    const cert = fs.readFileSync(certPath).toString();
    const keyFiles = fs.readdirSync(keyPath);
    const keyPEM = fs.readFileSync(path.join(keyPath, keyFiles[0])).toString();
    
    const walletPath = path.join('/opt/gopath/src/github.com/hyperledger/fabric/peer', 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    
    const identity = {
      credentials: {
        certificate: cert,
        privateKey: keyPEM,
      },
      mspId: 'BankMSP',
      type: 'X.509',
    };
    
    await wallet.put('bankAdmin', identity);
    console.log('Successfully enrolled Bank admin');
  } catch (error) {
    console.error('Failed to enroll admin:', error);
    process.exit(1);
  }
}

enrollAdmin();
" >nul 2>&1

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Bank Admin enrolled
) else (
    echo [WARNING] Bank Admin enrollment failed
)
echo.

REM ============================================================================
REM ENROLL NBE ADMIN
REM ============================================================================
echo [3/5] Enrolling NBE Admin...
docker exec cli node -e "
const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function enrollAdmin() {
  try {
    const ccpPath = '/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/nbe.example.com';
    const certPath = path.join(ccpPath, 'users/Admin@nbe.example.com/msp/signcerts/Admin@nbe.example.com-cert.pem');
    const keyPath = path.join(ccpPath, 'users/Admin@nbe.example.com/msp/keystore');
    
    const cert = fs.readFileSync(certPath).toString();
    const keyFiles = fs.readdirSync(keyPath);
    const keyPEM = fs.readFileSync(path.join(keyPath, keyFiles[0])).toString();
    
    const walletPath = path.join('/opt/gopath/src/github.com/hyperledger/fabric/peer', 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    
    const identity = {
      credentials: {
        certificate: cert,
        privateKey: keyPEM,
      },
      mspId: 'NBEMSP',
      type: 'X.509',
    };
    
    await wallet.put('nbeAdmin', identity);
    console.log('Successfully enrolled NBE admin');
  } catch (error) {
    console.error('Failed to enroll admin:', error);
    process.exit(1);
  }
}

enrollAdmin();
" >nul 2>&1

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] NBE Admin enrolled
) else (
    echo [WARNING] NBE Admin enrollment failed
)
echo.

REM ============================================================================
REM ENROLL CUSTOMS ADMIN
REM ============================================================================
echo [4/5] Enrolling Customs Admin...
docker exec cli node -e "
const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function enrollAdmin() {
  try {
    const ccpPath = '/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/customs.example.com';
    const certPath = path.join(ccpPath, 'users/Admin@customs.example.com/msp/signcerts/Admin@customs.example.com-cert.pem');
    const keyPath = path.join(ccpPath, 'users/Admin@customs.example.com/msp/keystore');
    
    const cert = fs.readFileSync(certPath).toString();
    const keyFiles = fs.readdirSync(keyPath);
    const keyPEM = fs.readFileSync(path.join(keyPath, keyFiles[0])).toString();
    
    const walletPath = path.join('/opt/gopath/src/github.com/hyperledger/fabric/peer', 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    
    const identity = {
      credentials: {
        certificate: cert,
        privateKey: keyPEM,
      },
      mspId: 'CustomsMSP',
      type: 'X.509',
    };
    
    await wallet.put('customsAdmin', identity);
    console.log('Successfully enrolled Customs admin');
  } catch (error) {
    console.error('Failed to enroll admin:', error);
    process.exit(1);
  }
}

enrollAdmin();
" >nul 2>&1

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Customs Admin enrolled
) else (
    echo [WARNING] Customs Admin enrollment failed
)
echo.

REM ============================================================================
REM ENROLL SHIPPING ADMIN
REM ============================================================================
echo [5/5] Enrolling Shipping Admin...
docker exec cli node -e "
const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function enrollAdmin() {
  try {
    const ccpPath = '/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/shipping.example.com';
    const certPath = path.join(ccpPath, 'users/Admin@shipping.example.com/msp/signcerts/Admin@shipping.example.com-cert.pem');
    const keyPath = path.join(ccpPath, 'users/Admin@shipping.example.com/msp/keystore');
    
    const cert = fs.readFileSync(certPath).toString();
    const keyFiles = fs.readdirSync(keyPath);
    const keyPEM = fs.readFileSync(path.join(keyPath, keyFiles[0])).toString();
    
    const walletPath = path.join('/opt/gopath/src/github.com/hyperledger/fabric/peer', 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    
    const identity = {
      credentials: {
        certificate: cert,
        privateKey: keyPEM,
      },
      mspId: 'ShippingMSP',
      type: 'X.509',
    };
    
    await wallet.put('shippingAdmin', identity);
    console.log('Successfully enrolled Shipping admin');
  } catch (error) {
    console.error('Failed to enroll admin:', error);
    process.exit(1);
  }
}

enrollAdmin();
" >nul 2>&1

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Shipping Admin enrolled
) else (
    echo [WARNING] Shipping Admin enrollment failed
)
echo.

REM ============================================================================
REM COPY WALLET TO BRIDGE SERVICE
REM ============================================================================
echo [6/6] Copying wallet to blockchain bridge service...
docker cp cli:/opt/gopath/src/github.com/hyperledger/fabric/peer/wallet ./temp-wallet >nul 2>&1
docker cp ./temp-wallet coffee-bridge:/app/wallet >nul 2>&1
rmdir /s /q temp-wallet >nul 2>&1

echo [SUCCESS] Wallet copied to bridge service
echo.

echo.
echo ============================================================================
echo              ADMIN IDENTITIES ENROLLED!
echo ============================================================================
echo.
echo All admin identities have been enrolled and wallet copied to bridge service.
echo Restarting blockchain bridge service...
echo.

docker-compose -f ../docker-compose-hybrid.yml restart coffee-bridge >nul 2>&1

echo [SUCCESS] Bridge service restarted
echo.
echo ============================================================================

endlocal
pause
