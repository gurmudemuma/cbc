# Codebase Convenience Cleanup Plan

## Issues Identified

### 1. Documentation Overload (80+ files)
- Multiple versions of same documentation (DATABASE_CONNECTION_*, STARTUP_GUIDE_*, etc.)
- Outdated files mixed with current ones
- No clear hierarchy or organization
- Difficult to find authoritative source

### 2. Script Duplication
- Multiple startup scripts: `start-all.sh`, `start-all-apis.sh`, `start-services.sh`, `start-infrastructure.sh`
- Multiple verification scripts: `verify-*.sh` (4 different ones)
- Unclear which script to use

### 3. No Clear Entry Point
- 10+ README/QUICK_START files
- No single source of truth
- Confusing for new developers

### 4. Root Directory Clutter
- 100+ files at root level
- No logical organization
- Hard to navigate

## Recommended Actions

### Phase 1: Documentation Organization
1. Create `/docs` directory structure
2. Move all documentation to organized folders
3. Keep only essential files at root
4. Create single authoritative README

### Phase 2: Script Consolidation
1. Create `/scripts` directory
2. Consolidate startup scripts into one
3. Consolidate verification scripts into one
4. Create script index/menu

### Phase 3: Configuration Organization
1. Create `/config` directory (if not exists)
2. Move docker-compose files to config
3. Move environment templates to config

### Phase 4: Cleanup
1. Archive old documentation
2. Remove duplicate files
3. Update .gitignore

## Benefits
- ✓ Easier navigation
- ✓ Clear entry points
- ✓ Reduced cognitive load
- ✓ Better onboarding
- ✓ Cleaner git history
