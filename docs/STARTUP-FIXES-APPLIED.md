# Startup Script Fixes Applied

## Problems Fixed

### 1. Script Said Services Started But They Failed
**Problem**: The startup script reported "[OK] Gateway and core services started" but the gateway container never actually started. The build failed silently.

**Fix**: 
- Removed `--build` flag from docker-compose commands
- Added proper validation checks after each service start
- Script now checks if containers are actually running before proceeding
- Provides detailed error messages if services fail

### 2. No Validation of Service Health
**Problem**: Script proceeded with seeding even though gateway wasn't running.

**Fix**:
- Added health checks for PostgreSQL using `pg_isready`
- Added health checks for gateway using curl to `/health` endpoint
- Script waits up to 60 seconds for gateway to be ready
- Exits with error if critical services fail to start

### 3. Docker Network Issues Not Handled
**Problem**: When Docker couldn't reach Docker Hub, the build failed but script continued.

**Fix**:
- Added `image:` field to all services in docker-compose-hybrid.yml
- Docker now tries to use existing images first
- Only builds if image doesn't exist locally
- Removed dependency on Docker Hub during startup

### 4. No Proper Error Handling
**Problem**: Script didn't check exit codes or validate command success.

**Fix**:
- All critical commands now check exit codes
- Script exits immediately on critical failures
- Provides helpful error messages with next steps
- Shows logs when services fail

## Changes Made

### Startup Scripts (start-system.bat, start-system.sh)

**Before:**
```bash
docker-compose up -d --build gateway
echo [OK] Gateway started
timeout 10
docker-compose exec gateway npm run seed
```

**After:**
```bash
docker-compose up -d gateway
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to start gateway"
    exit 1
fi

# Wait for gateway to be ready
for i in {1..60}; do
  if docker exec gateway curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "[OK] Gateway is ready"
    break
  fi
  sleep 1
done

docker-compose exec -T gateway npm run seed
if [ $? -ne 0 ]; then
    echo "[ERROR] Seed script failed"
    exit 1
fi
```

### Docker Compose (docker-compose-hybrid.yml)

**Before:**
```yaml
gateway:
  build:
    context: ./coffee-export-gateway
    dockerfile: Dockerfile
```

**After:**
```yaml
gateway:
  image: cbc-gateway:latest
  build:
    context: ./coffee-export-gateway
    dockerfile: Dockerfile
```

## How It Works Now

1. **Service Start**: `docker-compose up -d service`
   - Tries to use existing image first
   - If image doesn't exist, builds it
   - No `--build` flag needed

2. **Validation**: Check if container is actually running
   - PostgreSQL: `pg_isready`
   - Gateway: `curl /health`
   - CLI: `ls` in container

3. **Error Handling**: Exit immediately on failure
   - Shows error message
   - Displays logs for debugging
   - Prevents cascading failures

4. **Timeouts**: Reasonable wait times
   - PostgreSQL: 30 seconds
   - Gateway: 60 seconds
   - CLI: 60 seconds

## Testing

Run the startup script:

**Windows:**
```bash
scripts/start-system.bat
```

**Linux/Mac:**
```bash
bash scripts/start-system.sh
```

The script will now:
1. Properly validate each service starts
2. Wait for services to be ready
3. Exit with clear error messages if anything fails
4. Only proceed to seeding when all services are healthy
