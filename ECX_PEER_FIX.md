# ECX Peer Timeout Fix

## Issue
ECX peer initialization was timing out because **couchdb6 was not being started**.

## Root Cause
- ECX peer depends on `couchdb6` (port 5984)
- Start script only started `couchdb0-5` (missing couchdb6)
- ECX peer couldn't connect to its database

## Fix Applied
Updated `scripts/start.sh` to include couchdb6:
- Added couchdb6 to startup command
- Updated volume creation loop: `{0..6}`
- Updated verification loop: `{0..6}`

## Immediate Action Taken
```bash
✅ Created couchdb6 volume
✅ Started couchdb6 container
```

## Status
✅ **FIXED** - ECX peer should now start successfully

---
**Date:** Dec 15, 2025 15:45 EAT
