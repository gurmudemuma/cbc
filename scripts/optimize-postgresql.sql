-- ============================================================================
-- PostgreSQL Optimization Script
-- Optimizes database for hybrid Fabric + PostgreSQL architecture
-- ============================================================================

-- Connect to the database
\c coffee_export_db

-- ============================================================================
-- 1. CREATE INDEXES FOR FAST QUERIES
-- ============================================================================

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_tin ON users(tin);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status);
CREATE INDEX IF NOT EXISTS idx_users_status_created ON users(status, created_at DESC);

-- Shipment indexes (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'shipments') THEN
        CREATE INDEX IF NOT EXISTS idx_shipments_exporter ON shipments(exporter_id);
        CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
        CREATE INDEX IF NOT EXISTS idx_shipments_created ON shipments(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_shipments_exporter_status ON shipments(exporter_id, status);
    END IF;
END $$;

-- Certificate indexes (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'certificates') THEN
        CREATE INDEX IF NOT EXISTS idx_certificates_shipment ON certificates(shipment_id);
        CREATE INDEX IF NOT EXISTS idx_certificates_type ON certificates(certificate_type);
        CREATE INDEX IF NOT EXISTS idx_certificates_status ON certificates(status);
    END IF;
END $$;

-- ============================================================================
-- 2. CREATE MATERIALIZED VIEWS FOR ANALYTICS
-- ============================================================================

-- Dashboard statistics view
DROP MATERIALIZED VIEW IF EXISTS mv_dashboard_stats CASCADE;
CREATE MATERIALIZED VIEW mv_dashboard_stats AS
SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE status = 'approved') as approved_users,
    COUNT(*) FILTER (WHERE status = 'pending_approval') as pending_users,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected_users,
    COUNT(*) FILTER (WHERE role = 'exporter') as total_exporters,
    COUNT(*) FILTER (WHERE role = 'admin') as total_admins,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new_this_week,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_this_month,
    MAX(created_at) as last_registration,
    NOW() as last_updated
FROM users;

-- Create index on materialized view
CREATE UNIQUE INDEX ON mv_dashboard_stats (last_updated);

-- User activity by date view
DROP MATERIALIZED VIEW IF EXISTS mv_user_activity CASCADE;
CREATE MATERIALIZED VIEW mv_user_activity AS
SELECT 
    DATE(created_at) as activity_date,
    COUNT(*) as registrations,
    COUNT(*) FILTER (WHERE status = 'approved') as approved,
    COUNT(*) FILTER (WHERE status = 'pending_approval') as pending,
    COUNT(*) FILTER (WHERE role = 'exporter') as exporters,
    COUNT(*) FILTER (WHERE role = 'admin') as admins
FROM users
WHERE created_at > NOW() - INTERVAL '90 days'
GROUP BY DATE(created_at)
ORDER BY activity_date DESC;

-- Create index on materialized view
CREATE INDEX ON mv_user_activity (activity_date DESC);

-- ============================================================================
-- 3. CREATE REFRESH FUNCTION
-- ============================================================================

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_stats;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_activity;
    RAISE NOTICE 'Materialized views refreshed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. ANALYZE TABLES FOR QUERY OPTIMIZATION
-- ============================================================================

ANALYZE users;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'shipments') THEN
        ANALYZE shipments;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'certificates') THEN
        ANALYZE certificates;
    END IF;
END $$;

-- ============================================================================
-- 5. ENABLE QUERY STATISTICS (if not already enabled)
-- ============================================================================

-- Note: This requires pg_stat_statements extension
-- Uncomment if you want to enable query performance tracking
-- CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- ============================================================================
-- 6. VACUUM AND OPTIMIZE
-- ============================================================================

VACUUM ANALYZE users;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'shipments') THEN
        VACUUM ANALYZE shipments;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'certificates') THEN
        VACUUM ANALYZE certificates;
    END IF;
END $$;

-- ============================================================================
-- 7. DISPLAY OPTIMIZATION RESULTS
-- ============================================================================

\echo '============================================'
\echo 'PostgreSQL Optimization Complete!'
\echo '============================================'
\echo ''
\echo 'Indexes Created:'
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

\echo ''
\echo 'Materialized Views:'
SELECT 
    schemaname,
    matviewname,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||matviewname)) as size
FROM pg_matviews
WHERE schemaname = 'public';

\echo ''
\echo 'Table Statistics:'
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    n_live_tup as rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

\echo ''
\echo '============================================'
\echo 'Next Steps:'
\echo '1. Restart gateway: docker-compose -f docker-compose-hybrid.yml restart gateway'
\echo '2. Test analytics: curl http://localhost:3000/api/analytics/dashboard'
\echo '3. Refresh views periodically: SELECT refresh_materialized_views();'
\echo '============================================'
