# IPFS Setup Complete

## Summary

IPFS (InterPlanetary File System) has been successfully upgraded and is now running.

## Details

- **IPFS Version**: 0.32.1 (Kubo)
- **Repo Version**: 16
- **Peer ID**: 12D3KooWP5eDpyKkGho6f2Mk6BrbNhSMepqdYgD21uq844MdY8Jw
- **Process ID**: 30549

## Services Running

- **RPC API**: http://127.0.0.1:5001
- **WebUI**: http://127.0.0.1:5001/webui
- **Gateway**: http://127.0.0.1:8080
- **Swarm**: Multiple addresses on port 4001 (TCP+UDP)

## What Was Fixed

1. **Problem**: IPFS version 0.18.0 (repo v13) was incompatible with existing repo v16
2. **Solution**: Upgraded IPFS to version 0.32.1 which supports repo v16
3. **Result**: IPFS daemon is now running successfully in the background

## Usage

### Check IPFS Status
```bash
ipfs id
```

### Check Daemon Process
```bash
ps aux | grep "ipfs daemon"
```

### Stop IPFS Daemon
```bash
kill $(pgrep -f 'ipfs daemon')
```

### Start IPFS Daemon
```bash
nohup ipfs daemon > /tmp/ipfs.log 2>&1 &
```

### View IPFS Logs
```bash
tail -f /tmp/ipfs.log
```

### Access WebUI
Open in browser: http://127.0.0.1:5001/webui

## Integration with CBC System

The CBC (Coffee Bean Chain) system uses IPFS for:
- Storing document hashes
- Decentralized file storage
- Certificate and compliance document management

The IPFS service is integrated with the API services through the `shared/ipfs.service.ts` module.

## Notes

- IPFS daemon is running in the background
- Logs are stored in `/tmp/ipfs.log`
- The daemon will need to be restarted after system reboot
- Consider adding IPFS to system startup if needed
