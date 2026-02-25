-- CBC Database Initialization Script
-- This script initializes the PostgreSQL database for the CBC project
-- It runs all migration files in order

-- Set database encoding and locale
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

-- Create database if it doesn't exist (this is handled by docker-entrypoint-initdb.d)
-- The database 'coffee_export_db' is already created by the POSTGRES_DB environment variable

-- Connect to the database
\c coffee_export_db;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Run migration 001: Create ECTA pre-registration tables
\i /docker-entrypoint-initdb.d/migrations/001_create_ecta_preregistration_tables.sql

-- Run migration 002: Create documents table
\i /docker-entrypoint-initdb.d/migrations/002_create_documents_table.sql

-- Run migration 003: Create audit log table
\i /docker-entrypoint-initdb.d/migrations/003_create_audit_log_table.sql

-- Run migration 004: Create exports table
\i /docker-entrypoint-initdb.d/migrations/004_create_exports_table.sql

-- Run migration 005: Create users table
\i /docker-entrypoint-initdb.d/migrations/005_create_users_table.sql

-- Run migration 006: Fix exports status values
\i /docker-entrypoint-initdb.d/migrations/006_fix_exports_status_values.sql

-- Run migration 007: Add ESW integration
\i /docker-entrypoint-initdb.d/migrations/007_add_esw_integration.sql

-- Run migration 008: Add organization to exports
\i /docker-entrypoint-initdb.d/migrations/008_add_organization_to_exports.sql

-- Run migration 009: Add TIN to exports
\i /docker-entrypoint-initdb.d/migrations/009_add_tin_to_exports.sql

-- Run migration 011: Create universal renewal table
\i /docker-entrypoint-initdb.d/migrations/011_create_universal_renewal_table.sql

-- Run migration 012: Add blockchain user synchronization fields
\i /docker-entrypoint-initdb.d/migrations/012_add_blockchain_user_fields.sql

-- ============================================================================
-- HYBRID BLOCKCHAIN SYSTEM MIGRATIONS
-- ============================================================================

-- Run migration: Add sync tables (Fabric <-> CBC synchronization)
\i /docker-entrypoint-initdb.d/migrations/002_add_sync_tables.sql

-- Run migration: Add reconciliation tables (Daily consistency checks)
\i /docker-entrypoint-initdb.d/migrations/003_add_reconciliation_tables.sql

-- Run migration: Add Phase 4 tables (Customs & Logistics)
\i /docker-entrypoint-initdb.d/migrations/004_add_phase4_tables.sql

-- Insert initial data if needed
-- You can add initial data here

-- Set up permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Log completion
SELECT 'CBC Database initialization completed successfully' as status;
