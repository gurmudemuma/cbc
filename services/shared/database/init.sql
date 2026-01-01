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
\i /docker-entrypoint-initdb.d/001_create_ecta_preregistration_tables.sql

-- Run migration 002: Create documents table
\i /docker-entrypoint-initdb.d/002_create_documents_table.sql

-- Run migration 003: Create audit log table
\i /docker-entrypoint-initdb.d/003_create_audit_log_table.sql

-- Insert initial data if needed
-- You can add initial data here

-- Set up permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Log completion
SELECT 'CBC Database initialization completed successfully' as status;
