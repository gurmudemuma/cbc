@echo off
REM Fabric Network Management Tools
REM Quick access to common Fabric operations

:menu
cls
echo ========================================
echo Fabric Network Management Tools
echo ========================================
echo.
echo 1.  View Network Status
echo 2.  View Container Logs
echo 3.  Query Chaincode
echo 4.  Invoke Chaincode
echo 5.  Check Channel Info
echo 6.  List Installed Chaincodes
echo 7.  View Blockchain Info
echo 8.  Restart Network
echo 9.  Clean Network (Stop and Remove)
echo 10. View Resource Usage
echo 11. Execute Custom Command in CLI
echo 12. Backup Ledger Data
echo 0.  Exit
echo.
set /p choice="Enter your choice (0-12): "

if "%choice%"=="1" goto status
if "%choice%"=="2" goto logs
if "%choice%"=="3" goto query
if "%choice%"=="4" goto invoke
if "%choice%"=="5" goto channel_info
if "%choice%"=="6" goto list_chaincode
if "%choice%"=="7" goto blockchain_info
if "%choice%"=="8" goto restart
if "%choice%"=="9" goto clean
if "%choice%"=="10" goto resources
if "%choice%"=="11" goto custom
if "%choice%"=="12" goto backup
if "%choice%"=="0" goto end
goto menu

:status
cls
echo ========================================
echo Network Status
echo ========================================
echo.
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo.
pause
goto menu

:logs
cls
echo ========================================
echo Container Logs
echo ========================================
echo.
echo Which container?
echo 1. orderer1
echo 2. peer0.ecta
echo 3. peer1.ecta
echo 4. peer0.bank
echo 5. peer0.nbe
echo 6. peer0.customs
echo 7. peer0.shipping
echo 8. cli
echo.
set /p log_choice="Enter choice: "

if "%log_choice%"=="1" set container=orderer1.orderer.example.com
if "%log_choice%"=="2" set container=peer0.ecta.example.com
if "%log_choice%"=="3" set container=peer1.ecta.example.com
if "%log_choice%"=="4" set container=peer0.bank.example.com
if "%log_choice%"=="5" set container=peer0.nbe.example.com
if "%log_choice%"=="6" set container=peer0.customs.example.com
if "%log_choice%"=="7" set container=peer0.shipping.example.com
if "%log_choice%"=="8" set container=cli

echo.
echo Showing last 50 lines of %container%:
echo.
docker logs --tail 50 %container%
echo.
pause
goto menu

:query
cls
echo ========================================
echo Query Chaincode
echo ========================================
echo.
echo Common queries:
echo 1. Get Exporter Profile
echo 2. Get Export Request
echo 3. Verify Certificate
echo 4. Get Exporter Exports
echo 5. Get Exports by Status
echo 6. Custom Query
echo.
set /p query_choice="Enter choice: "

if "%query_choice%"=="1" (
    set /p exporter_id="Enter Exporter ID: "
    docker exec cli peer chaincode query -C coffeechannel -n ecta -c "{\"function\":\"GetExporterProfile\",\"Args\":[\"%exporter_id%\"]}"
)
if "%query_choice%"=="2" (
    set /p export_id="Enter Export ID: "
    docker exec cli peer chaincode query -C coffeechannel -n ecta -c "{\"function\":\"GetExportRequest\",\"Args\":[\"%export_id%\"]}"
)
if "%query_choice%"=="3" (
    set /p cert_id="Enter Certificate ID: "
    docker exec cli peer chaincode query -C coffeechannel -n ecta -c "{\"function\":\"VerifyCertificate\",\"Args\":[\"%cert_id%\"]}"
)
if "%query_choice%"=="4" (
    set /p exporter_id="Enter Exporter ID: "
    docker exec cli peer chaincode query -C coffeechannel -n ecta -c "{\"function\":\"GetExporterExports\",\"Args\":[\"%exporter_id%\"]}"
)
if "%query_choice%"=="5" (
    set /p status="Enter Status: "
    docker exec cli peer chaincode query -C coffeechannel -n ecta -c "{\"function\":\"GetExportsByStatus\",\"Args\":[\"%status%\"]}"
)
if "%query_choice%"=="6" (
    set /p function="Enter Function Name: "
    set /p args="Enter Args (comma-separated): "
    docker exec cli peer chaincode query -C coffeechannel -n ecta -c "{\"function\":\"%function%\",\"Args\":[\"%args%\"]}"
)
echo.
pause
goto menu

:invoke
cls
echo ========================================
echo Invoke Chaincode
echo ========================================
echo.
echo WARNING: This will submit a transaction to the blockchain!
echo.
set /p function="Enter Function Name: "
set /p args="Enter Args JSON: "
echo.
echo Invoking %function%...
docker exec cli peer chaincode invoke -o orderer1.orderer.example.com:7050 --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem -C coffeechannel -n ecta --peerAddresses peer0.ecta.example.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt -c "{\"function\":\"%function%\",\"Args\":[\"%args%\"]}"
echo.
pause
goto menu

:channel_info
cls
echo ========================================
echo Channel Information
echo ========================================
echo.
echo Channels:
docker exec cli peer channel list
echo.
echo Channel Info for coffeechannel:
docker exec cli peer channel getinfo -c coffeechannel
echo.
pause
goto menu

:list_chaincode
cls
echo ========================================
echo Installed Chaincodes
echo ========================================
echo.
echo Installed on peer:
docker exec cli peer lifecycle chaincode queryinstalled
echo.
echo Committed on channel:
docker exec cli peer lifecycle chaincode querycommitted -C coffeechannel
echo.
pause
goto menu

:blockchain_info
cls
echo ========================================
echo Blockchain Information
echo ========================================
echo.
docker exec cli peer channel getinfo -c coffeechannel
echo.
echo Latest Block:
set /p block_num="Enter block number to view (or press Enter for latest): "
if "%block_num%"=="" (
    docker exec cli peer channel fetch newest -c coffeechannel
) else (
    docker exec cli peer channel fetch %block_num% -c coffeechannel
)
echo.
pause
goto menu

:restart
cls
echo ========================================
echo Restart Network
echo ========================================
echo.
echo This will restart all containers...
pause
docker-compose -f docker-compose-fabric.yml restart
echo.
echo Network restarted!
pause
goto menu

:clean
cls
echo ========================================
echo Clean Network
echo ========================================
echo.
echo WARNING: This will stop and remove all containers and volumes!
echo All blockchain data will be lost!
echo.
set /p confirm="Are you sure? (yes/no): "
if not "%confirm%"=="yes" goto menu
echo.
echo Stopping and removing containers...
docker-compose -f docker-compose-fabric.yml down -v
echo.
echo Pruning volumes...
docker volume prune -f
echo.
echo Network cleaned!
pause
goto menu

:resources
cls
echo ========================================
echo Resource Usage
echo ========================================
echo.
echo Container Resource Usage:
docker stats --no-stream
echo.
echo Disk Usage:
docker system df
echo.
pause
goto menu

:custom
cls
echo ========================================
echo Execute Custom Command
echo ========================================
echo.
echo Enter command to execute in CLI container:
set /p custom_cmd="Command: "
echo.
docker exec cli %custom_cmd%
echo.
pause
goto menu

:backup
cls
echo ========================================
echo Backup Ledger Data
echo ========================================
echo.
echo Creating backup of ledger data...
set backup_dir=backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set backup_dir=%backup_dir: =0%
mkdir %backup_dir%
echo.
echo Backing up peer0.ecta ledger...
docker cp peer0.ecta.example.com:/var/hyperledger/production %backup_dir%\peer0-ecta
echo.
echo Backing up peer1.ecta ledger...
docker cp peer1.ecta.example.com:/var/hyperledger/production %backup_dir%\peer1-ecta
echo.
echo Backup completed in %backup_dir%
pause
goto menu

:end
echo.
echo Exiting...
exit /b 0
