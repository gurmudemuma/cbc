# Windows Compatibility Fixes for Hyperledger Fabric

## Summary of Changes

This document explains the Windows-specific modifications made to run the Coffee Blockchain Consortium on Windows with Git Bash.

## Issues Fixed

### 1. **Binary Detection (.exe files)**
**Problem**: Git Bash on Windows doesn't reliably detect `.exe` files with `command -v`

**Solution**: Modified all scripts to:
- Check for `.exe` versions first using `command -v`
- Fall back to non-`.exe` versions
- Fall back to direct paths in `../bin/` directory

**Files Modified**:
- `network/network.sh` - peer.exe, cryptogen.exe
- `network/scripts/create-channel.sh` - configtxgen.exe, osnadmin.exe, peer.exe
- All binary detection now uses this pattern:
  ```bash
  if command -v binary.exe &> /dev/null; then
    CMD="binary.exe"
  elif command -v binary &> /dev/null; then
    CMD="binary"
  else
    # Try direct path
    if [ -x "${PWD}/../bin/binary.exe" ]; then
      CMD="${PWD}/../bin/binary.exe"
    fi
  fi
  ```

### 2. **DNS Resolution (No Hosts File Required!)**
**Problem**: Container hostnames like `orderer.coffee-export.com` require hosts file modifications

**Solution**: Use `localhost` with port mappings + TLS hostname override
- **From Host**: Connect to `localhost:PORT` with TLS hostname override
- **From Docker**: Use internal DNS (container names)

**Files Modified**:
- `network/scripts/envVar.sh`:
  - `CORE_PEER_ADDRESS=localhost:7051` (instead of peer0.exporterbank.coffee-export.com:7051)
  - `CORE_PEER_TLS_SERVERHOSTOVERRIDE=peer0.exporterbank.coffee-export.com`
  - Similar for all 4 peers and orderer

- `network/scripts/create-channel.sh`:
  - `ORDERER_ADMIN_ENDPOINT=localhost:7053`
  - Added `--tls-hostname-override orderer.coffee-export.com`

### 3. **TLS Certificate Validation**
**Problem**: Certificates are issued for container hostnames, not localhost

**Solution**: Use TLS hostname override to verify certificates while connecting to localhost

**Environment Variables Set**:
```bash
export CORE_PEER_TLS_SERVERHOSTOVERRIDE=peer0.exporterbank.coffee-export.com
```

**Command Flags Added**:
```bash
osnadmin --tls-hostname-override orderer.coffee-export.com
```

## Port Mappings (from docker-compose.yaml)

All required ports are already mapped in `docker-compose.yaml`:

| Service | Internal | External | Purpose |
|---------|----------|----------|---------|
| Orderer | 7050 | 7050 | Orderer endpoint |
| Orderer Admin | 7053 | 7053 | Admin operations |
| Peer0 ExporterBank | 7051 | 7051 | Peer endpoint |
| Peer0 NationalBank | 8051 | 8051 | Peer endpoint |
| Peer0 NCAT | 9051 | 9051 | Peer endpoint |
| Peer0 ShippingLine | 10051 | 10051 | Peer endpoint |

## How It Works

### Host Machine (Git Bash) Commands
```bash
# Connect to localhost with TLS override
peer channel join -b block.pb
# Uses: CORE_PEER_ADDRESS=localhost:7051
# Uses: CORE_PEER_TLS_SERVERHOSTOVERRIDE=peer0.exporterbank.coffee-export.com
```

### CLI Docker Container Commands
```bash
# Connect using internal Docker DNS
docker exec cli peer channel fetch
# Uses: CORE_PEER_ADDRESS=peer0.exporterbank.coffee-export.com:7051
# No TLS override needed - hostname matches certificate
```

## Benefits

✅ **No hosts file modification required**
✅ **Works on Windows, Linux, and Mac**
✅ **Maintains TLS security**
✅ **No administrator privileges needed**
✅ **Compatible with corporate networks/firewalls**

## Testing

Run the full startup:
```bash
./start-system.sh --clean
```

Expected flow:
1. ✅ Clean environment
2. ✅ Check prerequisites
3. ✅ Generate crypto material (cryptogen.exe)
4. ✅ Start Docker containers
5. ✅ Create channel (configtxgen.exe, osnadmin.exe)
6. ✅ Join peers to channel (peer.exe with localhost)
7. ✅ Deploy chaincode
8. ✅ Start APIs and frontend

## Troubleshooting

### Issue: "peer.exe not found"
**Solution**: Ensure `c:\cbc\bin` is in your PATH or the script will use direct paths

### Issue: "TLS certificate verification failed"
**Solution**: Ensure `CORE_PEER_TLS_SERVERHOSTOVERRIDE` is set correctly in envVar.sh

### Issue: "Connection refused to localhost:7051"
**Solution**: Check Docker containers are running: `docker ps`

## Version Information

- **Hyperledger Fabric**: 2.5.x
- **Platform**: Windows 10/11 with Git Bash (MINGW64)
- **Docker**: Docker Desktop for Windows
- **Shell**: Git Bash (bash.exe)

## Reference

Official Fabric docs on TLS: https://hyperledger-fabric.readthedocs.io/en/latest/enable_tls.html
