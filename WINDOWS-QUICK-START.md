# Windows Quick Start Guide

## Prerequisites
- ✅ Docker Desktop running
- ✅ Git Bash installed
- ✅ Admin access (for one-time hosts file edit)

## ONE-TIME SETUP: Add Hosts File Entry

The `osnadmin` tool requires `orderer.coffee-export.com` to resolve to `127.0.0.1`.

### Option 1: Automated Script (Requires Admin)
```bash
# Run Git Bash as Administrator
cd /c/cbc
chmod +x update-hosts.sh
./update-hosts.sh
```

### Option 2: Manual Edit (Recommended - Easiest)
1. Press `Win + X`
2. Select **Windows Terminal (Admin)** or **PowerShell (Admin)**
3. Run:
   ```powershell
   notepad C:\Windows\System32\drivers\etc\hosts
   ```
4. Add this line at the end:
   ```
   127.0.0.1 orderer.coffee-export.com
   ```
5. **Save** and close Notepad

### Verify It Works
```bash
ping orderer.coffee-export.com
# Should respond from 127.0.0.1
```

## Run the System

After adding the hosts entry, run:

```bash
cd /c/cbc
./start-system.sh --clean
```

## What Gets Started

The startup script will:
1. ✅ Clean environment
2. ✅ Generate crypto material using `cryptogen.exe`
3. ✅ Start Docker containers (orderer + 4 peers + CouchDB)
4. ✅ Create channel using `configtxgen.exe` + `osnadmin.exe`
5. ✅ Join peers to channel using `peer.exe` (via localhost)
6. ✅ Deploy chaincodes (coffee-export, user-management)
7. ✅ Start 4 API services
8. ✅ Start React frontend

## Access the System

Once started:
- **Frontend**: http://localhost:5173
- **Exporter Bank API**: http://localhost:3001
- **National Bank API**: http://localhost:3002
- **NCAT API**: http://localhost:3003
- **Shipping Line API**: http://localhost:3004

## Troubleshooting

### "osnadmin: connection refused"
**Cause**: Hosts file not configured  
**Fix**: Add `127.0.0.1 orderer.coffee-export.com` to hosts file (see above)

### "peer.exe not found"
**Cause**: Binaries not in PATH  
**Fix**: The script uses direct paths, should work automatically

### "Docker not running"
**Cause**: Docker Desktop not started  
**Fix**: Start Docker Desktop and wait for it to be ready

### "Port already in use"
**Cause**: Previous containers still running  
**Fix**: 
```bash
cd /c/cbc/network
./network.sh down
```

## Clean Restart

To completely reset:
```bash
./start-system.sh --clean
```

This will:
- Stop all containers
- Remove all volumes
- Delete generated crypto material
- Rebuild everything from scratch

## Technical Details

### Why Only Orderer Needs Hosts File?

- **Orderer**: `osnadmin.exe` doesn't support TLS hostname override → needs hosts file
- **Peers**: `peer.exe` supports `CORE_PEER_TLS_SERVERHOSTOVERRIDE` → uses localhost

### Port Mappings

| Service | Port | Protocol |
|---------|------|----------|
| Orderer | 7050 | gRPC |
| Orderer Admin | 7053 | REST |
| Peer0 ExporterBank | 7051 | gRPC |
| Peer0 NationalBank | 8051 | gRPC |
| Peer0 NCAT | 9051 | gRPC |
| Peer0 ShippingLine | 10051 | gRPC |

All mapped to localhost and accessible from host machine.

## Need Help?

Check the detailed documentation:
- `WINDOWS-SETUP-NOTES.md` - Technical implementation details
- `README.md` - Project overview
