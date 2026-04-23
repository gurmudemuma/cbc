@echo off
REM ============================================================================
REM JOIN ORDERERS TO CHANNEL using Channel Participation API
REM ============================================================================

setlocal enabledelayedexpansion

echo.
echo ============================================================================
echo              JOIN ORDERERS TO CHANNEL
echo ============================================================================
echo.

set CHANNEL_NAME=coffeechannel
set CHANNEL_BLOCK=/opt/gopath/src/github.com/hyperledger/fabric/peer/%CHANNEL_NAME%.block

echo Channel: %CHANNEL_NAME%
echo Block file: %CHANNEL_BLOCK%
echo.

REM ============================================================================
REM JOIN ORDERERS TO CHANNEL
REM ============================================================================

echo [1/3] Joining orderer1 to channel...
docker exec cli osnadmin channel join --channelID %CHANNEL_NAME% --config-block %CHANNEL_BLOCK% -o orderer1.orderer.example.com:7053 --ca-file /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem --client-cert /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/tls/server.crt --client-key /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/tls/server.key
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Orderer1 join failed or already joined
)
echo [SUCCESS] Orderer1 processed
echo.

echo [2/3] Joining orderer2 to channel...
docker exec cli osnadmin channel join --channelID %CHANNEL_NAME% --config-block %CHANNEL_BLOCK% -o orderer2.orderer.example.com:8053 --ca-file /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/ordererOrganizations/orderer.example.com/orderers/orderer2.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem --client-cert /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/ordererOrganizations/orderer.example.com/orderers/orderer2.orderer.example.com/tls/server.crt --client-key /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/ordererOrganizations/orderer.example.com/orderers/orderer2.orderer.example.com/tls/server.key
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Orderer2 join failed or already joined
)
echo [SUCCESS] Orderer2 processed
echo.

echo [3/3] Joining orderer3 to channel...
docker exec cli osnadmin channel join --channelID %CHANNEL_NAME% --config-block %CHANNEL_BLOCK% -o orderer3.orderer.example.com:9053 --ca-file /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/ordererOrganizations/orderer.example.com/orderers/orderer3.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem --client-cert /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/ordererOrganizations/orderer.example.com/orderers/orderer3.orderer.example.com/tls/server.crt --client-key /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/ordererOrganizations/orderer.example.com/orderers/orderer3.orderer.example.com/tls/server.key
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Orderer3 join failed or already joined
)
echo [SUCCESS] Orderer3 processed
echo.

REM ============================================================================
REM VERIFY ORDERERS JOINED
REM ============================================================================
echo.
echo ============================================================================
echo VERIFYING ORDERERS JOINED CHANNEL
echo ============================================================================
echo.

echo Orderer1 channels:
docker exec cli osnadmin channel list -o orderer1.orderer.example.com:7053 --ca-file /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem --client-cert /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/tls/server.crt --client-key /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/tls/server.key
echo.

echo.
echo ============================================================================
echo              ORDERERS JOINED CHANNEL!
echo ============================================================================
echo.
echo Next: Run complete-blockchain-setup.bat to approve and commit chaincode
echo.
echo ============================================================================

endlocal
pause
