# Testing Scripts

This directory contains scripts for testing and verifying the CBC system.

## Integration Tests

- **verify-full-integration.js** - Comprehensive integration test across all services
- **comprehensive-verification.js** - Verifies exporters and ECTA workflows
- **system-consistency-check.js** - Cross-system data consistency checks

## Component Tests

- **test-frontend-data.js** - Tests frontend data endpoints
- **test-ecta-login.js** - Tests ECTA authentication
- **test-export-creation.js** - Tests export creation workflow
- **test-exporter-view.js** - Tests exporter dashboard views

## Verification Scripts

- **verify-exporter-workflow.js** - Verifies complete exporter workflow
- **verify_bank_stats.js** - Verifies bank statistics
- **verify_ecta_stats.js** - Verifies ECTA statistics
- **verify_ecta_view.ts** - Verifies ECTA views
- **verify_stats_api.js** - Verifies statistics APIs

## Usage

Run any test script from the project root:

```bash
node scripts/testing/verify-full-integration.js
```

## Note

These scripts are for development and testing purposes only. They should not be deployed to production environments.
