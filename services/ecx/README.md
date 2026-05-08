# ECX API - Ethiopian Commodity Exchange

## Overview

The ECX (Ethiopian Commodity Exchange) API provides **optional** lot verification and trading services for coffee exporters.

## Important: ECX is Optional

Since the 2017 regulatory changes (Proclamation 1051/2017 & Directive 433/2019), **ECX is no longer mandatory** for specialty coffee exports (grades 1-4).

### When to Use ECX:
- ✅ Trading non-specialty coffee (grades 5+)
- ✅ Exporters who prefer ECX's standardized pricing
- ✅ Exporters who want ECX's payment guarantee system
- ✅ Exporters without direct sourcing relationships

### When ECX Can Be Skipped:
- 🔶 Specialty coffee (grades 1-4)
- 🔶 Direct sourcing from cooperatives/farmers
- 🔶 Vertical integration models
- 🔶 Exporters seeking better traceability
- 🔶 Premium pricing opportunities

## Service Details

**Port**: 3006  
**Organization**: Uses ECTA's blockchain identity  
**Database**: Shared PostgreSQL (`coffee_export_db`)

## API Endpoints

### Lot Verification
- `POST /api/ecx/exports/:id/verify` - Verify ECX lot
- `POST /api/ecx/exports/:id/reject` - Reject ECX lot
- `GET /api/lot-verification` - Get verification status

## Workflow Integration

### With ECX (Optional Path):
```
CREATED → ECX_PENDING → ECX_VERIFIED → ECTA_LICENSE_PENDING → ...
```

### Without ECX (Direct Path):
```
CREATED → ECTA_LICENSE_PENDING → ECTA_LICENSE_APPROVED → ...
```

## Configuration

The ECX service uses ECTA's blockchain infrastructure since ECTA handles all blockchain operations for ECX.

See `.env` for configuration details.

## Development

```bash
# Install dependencies
npm install

# Run in development
npm run dev

# Build
npm run build

# Start production
npm start
```

## Notes

- ECX verification is **optional** in the export workflow
- Exporters can choose to bypass ECX for specialty coffee
- The UI should clearly indicate ECX as an optional step
- System should support both ECX and non-ECX workflows
