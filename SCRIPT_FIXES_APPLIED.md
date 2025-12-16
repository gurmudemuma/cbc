# Script Fixes Applied - December 15, 2025

## Overview
Reviewed and fixed inconsistencies and confusions in the `scripts/start.sh` file.

## Issues Found and Fixed

### 1. **SCRIPT_DIR Path Issue**
**Problem:** The script was setting `SCRIPT_DIR` to the scripts directory instead of the project root.
```bash
# Before:
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# After:
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd .. && pwd)"
```
**Impact:** All file references using `$SCRIPT_DIR` were pointing to wrong locations.

### 2. **Missing ECX Peer in Startup**
**Problem:** ECX peer was referenced in the wait loop but not started in the docker-compose command.
```bash
# Before:
docker-compose up -d \
    peer0.commercialbank.coffee-export.com \
    peer0.nationalbank.coffee-export.com \
    peer0.ecta.coffee-export.com \
    peer0.shippingline.coffee-export.com \
    peer0.custom-authorities.coffee-export.com

# After:
docker-compose up -d \
    peer0.commercialbank.coffee-export.com \
    peer0.nationalbank.coffee-export.com \
    peer0.ecta.coffee-export.com \
    peer0.ecx.coffee-export.com \
    peer0.shippingline.coffee-export.com \
    peer0.custom-authorities.coffee-export.com
```
**Impact:** ECX peer would never start, causing the wait loop to timeout.

### 3. **Missing CCAAS File Check**
**Problem:** Script assumed `docker-compose-ccaas.yml` exists without checking.
```bash
# Before:
if docker-compose -f "$SCRIPT_DIR/docker-compose-ccaas.yml" up -d; then

# After:
if [ -f "$SCRIPT_DIR/docker-compose-ccaas.yml" ]; then
    if docker-compose -f "$SCRIPT_DIR/docker-compose-ccaas.yml" up -d; then
        ...
    fi
else
    echo -e "${YELLOW}⚠ docker-compose-ccaas.yml not found, skipping CCAAS service${NC}"
fi
```
**Impact:** Script would fail if CCAAS file doesn't exist.

### 4. **Broken API Build Section**
**Problem:** Incomplete if-else statement with orphaned `else` clause.
```bash
# Before:
if docker image inspect coffee-export-api-base:latest >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Base image already exists, skipping build${NC}"
else
    echo -e "${YELLOW}Building shared API base image...${NC}"
    docker build -t coffee-export-api-base:latest -f api/Dockerfile.base api
fi

# Build all API services in parallel (much faster than sequential)
echo -e "${YELLOW}Skipping API build - using existing images${NC}"
else  # <-- ORPHANED ELSE
    echo -e "${RED}✗ Failed to build API services${NC}"
    exit 1
fi

# After:
if docker image inspect coffee-export-api-base:latest >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Base image already exists, skipping build${NC}"
else
    if [ -f "$SCRIPT_DIR/apis/Dockerfile.base" ]; then
        echo -e "${YELLOW}Building shared API base image...${NC}"
        docker build -t coffee-export-api-base:latest -f "$SCRIPT_DIR/apis/Dockerfile.base" "$SCRIPT_DIR/apis"
    else
        echo -e "${YELLOW}⚠ Base Dockerfile not found, skipping base image build${NC}"
    fi
fi

# Start API services
if docker-compose up -d \
    commercialbank-api \
    ...
```
**Impact:** Script would fail with syntax error.

### 5. **Incorrect Path Reference**
**Problem:** Used `api/Dockerfile.base` instead of `apis/Dockerfile.base`.
```bash
# Before:
docker build -t coffee-export-api-base:latest -f api/Dockerfile.base api

# After:
docker build -t coffee-export-api-base:latest -f "$SCRIPT_DIR/apis/Dockerfile.base" "$SCRIPT_DIR/apis"
```
**Impact:** Build would fail due to incorrect path.

### 6. **Malformed Echo Statement**
**Problem:** Missing `echo` command in API list.
```bash
# Before:
echo "  APIs:"
echo "    • Commercial Bank: http://localhost:3001"
echo "    • National Bank: http://localhost:3002"
echo "    • ECTA: http://localhost:3003"
    • ECX: http://localhost:3006  # <-- MISSING echo
echo "    • Shipping Line: http://localhost:3004"

# After:
echo "  APIs:"
echo "    • Commercial Bank: http://localhost:3001"
echo "    • National Bank: http://localhost:3002"
echo "    • ECTA: http://localhost:3003"
echo "    • Shipping Line: http://localhost:3004"
echo "    • Custom Authorities: http://localhost:3005"
echo "    • ECX: http://localhost:3006"
```
**Impact:** Output would be malformed and script might fail.

### 7. **Conditional Cleanup Command**
**Problem:** Always showing CCAAS cleanup command even if file doesn't exist.
```bash
# Before:
echo "  Stop system:"
echo "    • docker-compose down"
echo "    • docker-compose -f docker-compose-ccaas.yml down"

# After:
echo "  Stop system:"
echo "    • docker-compose down"
if [ -f "$SCRIPT_DIR/docker-compose-ccaas.yml" ]; then
    echo "    • docker-compose -f docker-compose-ccaas.yml down"
fi
```
**Impact:** Confusing instructions if CCAAS file doesn't exist.

## Summary of Changes

| Issue | Severity | Status |
|-------|----------|--------|
| SCRIPT_DIR path | Critical | ✅ Fixed |
| Missing ECX peer | High | ✅ Fixed |
| CCAAS file check | Medium | ✅ Fixed |
| Broken API build | Critical | ✅ Fixed |
| Incorrect path | High | ✅ Fixed |
| Malformed echo | Medium | ✅ Fixed |
| Conditional cleanup | Low | ✅ Fixed |

## Testing Recommendations

1. **Dry run test:**
   ```bash
   bash -n scripts/start.sh
   ```

2. **Test with missing files:**
   - Temporarily rename `docker-compose-ccaas.yml` to test graceful handling
   - Temporarily rename `apis/Dockerfile.base` to test fallback

3. **Full system test:**
   ```bash
   ./scripts/start.sh
   ```

## Additional Notes

- All fixes maintain backward compatibility
- Added defensive checks for file existence
- Improved error messages for better debugging
- Script now handles missing optional components gracefully

## Files Modified

- `/home/gu-da/cbc/scripts/start.sh` - Main startup script

## Verification

Run the following to verify syntax:
```bash
bash -n /home/gu-da/cbc/scripts/start.sh && echo "✅ Syntax OK" || echo "❌ Syntax Error"
```
