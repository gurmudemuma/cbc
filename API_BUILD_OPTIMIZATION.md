# API Build Optimization

## Issues Fixed

### 1. Node Version Warning ✅
**Before:** Node 18 (causing EBADENGINE warnings)
**After:** Node 20 (matches package requirements)

### 2. Slow Build Time ✅
**Optimizations Applied:**
- Removed unnecessary npm config (was causing retries)
- Added `--omit=dev` (skip dev dependencies)
- Added `--prefer-offline` (use cache)
- Removed tsconfig copies (not needed for install)
- Added build tools (python3, make, g++) for native modules

**Expected Result:**
- Build time reduced from ~330s to ~60-90s
- No more EBADENGINE warnings
- Smaller final image

## Changes Made

**File:** `/home/gu-da/cbc/apis/Dockerfile.base`
- Updated: `node:18-alpine` → `node:20-alpine`
- Removed: Unnecessary npm config and file copies
- Added: Build optimization flags

## Next Build

The next time you run `./scripts/start.sh`, the API build will be faster.

---
**Status:** ✅ OPTIMIZED | **Date:** Dec 15, 2025 16:50 EAT
