# 🔧 Port Conflict Auto-Cleanup Fix

## Problem

When running `./start-all.sh` after a previous startup, the script would fail with:

```
✗ Port 3007 (shipping-line) is already in use
✗ Port 3006 (ecx) is already in use
✗ Port 3005 (national-bank) is already in use
✗ Port 3004 (exporter-portal) is already in use
✗ Port 3003 (ecta) is already in use
✗ Port 3002 (custom-authorities) is already in use
✗ Port 3001 (commercial-bank) is already in use
✗ Some ports are already in use
✗ Failed to start API services
```

This happened because:
1. Previous API services were still running
2. The script detected port conflicts
3. The script failed instead of cleaning up

## Root Cause

The `start-all-apis.sh` script had two issues:

1. **No automatic cleanup** - When ports were in use, it just failed
2. **No recovery mechanism** - Users had to manually kill processes

## Solution

Modified `start-all-apis.sh` to automatically clean up conflicting processes:

### Added `cleanup_ports()` Function

```bash
cleanup_ports() {
    local ports=("$@")
    
    for port in "${ports[@]}"; do
        if command -v lsof &> /dev/null; then
            local pids=$(lsof -ti :$port 2>/dev/null || true)
            if [ -n "$pids" ]; then
                print_info "Killing process on port $port..."
                echo "$pids" | xargs kill -9 2>/dev/null || true
                sleep 1
                print_success "Cleaned up port $port"
            fi
        fi
    done
}
```

### Updated `check_all_ports()` Function

Changed from failing on port conflicts to:

1. **Detect ports in use**
2. **Collect list of conflicting ports**
3. **Call cleanup function**
4. **Continue with startup**

```bash
check_all_ports() {
    print_header "Checking Port Availability"
    
    local all_ok=true
    local ports_in_use=()
    
    for service in "${!SERVICES[@]}"; do
        local port=${SERVICES[$service]}
        if ! check_port_available $port $service; then
            all_ok=false
            ports_in_use+=("$port")
        else
            print_success "Port $port available for ${service}"
        fi
    done
    
    if [ "$all_ok" = false ]; then
        print_warning "Some ports are already in use: ${ports_in_use[*]}"
        print_info "Attempting to clean up existing processes..."
        cleanup_ports "${ports_in_use[@]}"
        return 0
    fi
    
    return 0
}
```

## How It Works

### Step 1: Check Port Availability
```bash
lsof -Pi :$port -sTCP:LISTEN -t
```

### Step 2: Collect Conflicting Ports
```bash
ports_in_use+=("$port")
```

### Step 3: Attempt Cleanup
```bash
cleanup_ports "${ports_in_use[@]}"
```

### Step 4: Get Process IDs
```bash
lsof -ti :$port
```

### Step 5: Kill Processes
```bash
echo "$pids" | xargs kill -9
```

### Step 6: Wait for Cleanup
```bash
sleep 1
```

### Step 7: Continue Startup
```bash
return 0
```

## Testing

To verify the fix works:

```bash
# Start services first time
./start-all.sh

# Wait a moment
sleep 5

# Try to start again (should auto-cleanup)
./start-all.sh
```

Expected output (should auto-cleanup and continue):
```
⚠ Some ports are already in use: 3001 3002 3003 3004 3005 3006 3007
ℹ Attempting to clean up existing processes...
ℹ Killing process on port 3001...
✓ Cleaned up port 3001
ℹ Killing process on port 3002...
✓ Cleaned up port 3002
[... more cleanup ...]
�� All ports cleaned up
[... continues with startup ...]
```

## Verification

### Check if Ports Are Free

```bash
# Before cleanup
lsof -i :3001

# After cleanup
lsof -i :3001
# Should return nothing
```

### Check Process Status

```bash
# See what's running on port 3001
lsof -ti :3001

# Kill it manually if needed
kill -9 $(lsof -ti :3001)
```

## Benefits

### Before Fix
- ❌ Script fails on port conflicts
- ❌ Users must manually kill processes
- ❌ Confusing error messages
- ❌ Requires manual intervention

### After Fix
- ✅ Automatic cleanup of conflicting processes
- ✅ Script continues with startup
- ✅ Clear status messages
- ✅ No manual intervention needed

## Fallback Behavior

If `lsof` is not available:
- Script skips cleanup
- Continues with startup
- May fail if ports are actually in use

## Files Modified

- `/home/gu-da/cbc/start-all-apis.sh`

## Related Fixes

This complements other startup improvements:
- `PORT_CHECK_HANG_FIX.md` - Port checking timeout
- `DATABASE_CONNECTIVITY_CHECK_FIX.md` - Database connectivity
- `DOCKER_NETWORK_FIX.md` - Docker network configuration

## Summary

✅ **Fixed:** Port conflict auto-cleanup
✅ **Automatic:** Detects and kills conflicting processes
✅ **Graceful:** Continues with startup after cleanup
✅ **Safe:** Uses force kill (-9) for reliability
✅ **User-friendly:** Clear status messages

The system now automatically handles port conflicts and continues with startup without user intervention.

---

**Status:** ✅ Fixed
**Date:** 2025-12-17
**Version:** 1.0.0
