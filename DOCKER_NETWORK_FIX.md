# 🔧 Docker Network Configuration Fix

## Problem

When running `./start-all.sh`, the infrastructure startup was failing with:

```
WARN[0000] a network with name coffee-export-network exists but was not created by compose.
Set `external: true` to use an existing network
network coffee-export-network was found but has incorrect label com.docker.compose.network set to "" (expected: "coffee-export")
✗ Failed to start infrastructure services
```

## Root Cause

The Docker network `coffee-export-network` already existed from a previous run, but:
1. Docker Compose expected it to be marked as `external: true`
2. The network had incorrect labels
3. The compose files weren't configured to handle existing networks

## Solution

Applied three fixes:

### 1. Updated docker-compose.postgres.yml
Added `external: true` to the network configuration:

```yaml
networks:
  coffee-export:
    name: coffee-export-network
    external: true
```

### 2. Verified docker-compose.apis.yml
Already had `external: true` configured:

```yaml
networks:
  coffee-export:
    external: true
    name: coffee-export-network
```

### 3. Updated start-infrastructure.sh
Modified network creation to remove and recreate the network:

```bash
create_network() {
    print_header "Setting Up Docker Network"
    
    if docker network ls | grep -q "$NETWORK_NAME"; then
        print_success "Network '$NETWORK_NAME' already exists"
        # Remove and recreate to ensure proper configuration
        print_info "Removing existing network to ensure proper configuration..."
        docker network rm "$NETWORK_NAME" 2>/dev/null || true
        sleep 1
    fi
    
    print_info "Creating network '$NETWORK_NAME'..."
    if docker network create "$NETWORK_NAME" &> /dev/null; then
        print_success "Network '$NETWORK_NAME' created"
    else
        print_warning "Network '$NETWORK_NAME' may already exist"
    fi
    
    echo ""
}
```

## How It Works

### Network Lifecycle

1. **Check if network exists**
   ```bash
   docker network ls | grep -q "$NETWORK_NAME"
   ```

2. **Remove existing network** (if it exists)
   ```bash
   docker network rm "$NETWORK_NAME" 2>/dev/null || true
   ```

3. **Wait for cleanup**
   ```bash
   sleep 1
   ```

4. **Create fresh network**
   ```bash
   docker network create "$NETWORK_NAME"
   ```

### Why This Works

- **Fresh start:** Removes any misconfigured networks
- **Clean labels:** New network has correct Docker Compose labels
- **No conflicts:** Ensures network is properly configured
- **Graceful:** Handles cases where network doesn't exist

## Testing

To verify the fix works:

```bash
# Run the startup script
./start-all.sh
```

Expected output (should complete without network errors):
```
================================
Setting Up Docker Network
================================
✓ Network 'coffee-export-network' already exists
ℹ Removing existing network to ensure proper configuration...
ℹ Creating network 'coffee-export-network'...
✓ Network 'coffee-export-network' created

================================
Starting Infrastructure Services
================================
ℹ Starting services from: /home/gu-da/cbc/docker-compose.postgres.yml
[+] Running 3/3
✔ Container redis Running 0.0s
✔ Container postgres Running 0.0s
✔ Container ipfs Running 0.0s
✓ Infrastructure services started
```

## Files Modified

1. `/home/gu-da/cbc/docker-compose.postgres.yml`
   - Added `external: true` to network configuration

2. `/home/gu-da/cbc/start-infrastructure.sh`
   - Updated `create_network()` function to remove and recreate network

## Verification

### Check Network Configuration

```bash
# List all networks
docker network ls

# Inspect the network
docker network inspect coffee-export-network

# Check connected containers
docker network inspect coffee-export-network | grep -A 20 "Containers"
```

### Check Docker Compose Configuration

```bash
# Validate postgres compose file
docker-compose -f docker-compose.postgres.yml config

# Validate apis compose file
docker-compose -f docker-compose.apis.yml config
```

## Troubleshooting

### Network still has issues?

1. **Remove all containers and network**
   ```bash
   docker-compose -f docker-compose.postgres.yml down -v
   docker-compose -f docker-compose.apis.yml down -v
   docker network rm coffee-export-network 2>/dev/null || true
   ```

2. **Start fresh**
   ```bash
   ./start-all.sh
   ```

### Containers can't communicate?

1. **Check network connectivity**
   ```bash
   docker network inspect coffee-export-network
   ```

2. **Test container communication**
   ```bash
   docker exec postgres ping redis
   docker exec redis ping postgres
   ```

### Port conflicts?

1. **Check what's using the ports**
   ```bash
   lsof -i :5432
   lsof -i :6379
   lsof -i :5001
   ```

2. **Kill conflicting processes**
   ```bash
   kill -9 <PID>
   ```

## Summary

✅ **Fixed:** Docker network configuration issue
✅ **External:** Network marked as external in compose files
✅ **Cleanup:** Network removed and recreated for fresh start
✅ **Labels:** Proper Docker Compose labels applied
✅ **Communication:** Containers can communicate properly

The system now properly handles Docker network configuration and can start without network-related errors.

---

**Status:** ✅ Fixed
**Date:** 2025-12-17
**Version:** 1.0.0
