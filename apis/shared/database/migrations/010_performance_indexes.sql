-- ============================================================================
-- COMPREHENSIVE PERFORMANCE INDEXES FOR TRADE FINANCE OPERATIONS
-- Based on actual database schema analysis
-- ============================================================================

-- ============================================================================
-- 1. EXPORTER PROFILES - Core entity queries
-- ============================================================================

-- Active exporters (most frequent query)
CREATE INDEX IF NOT EXISTS idx_exporter_profiles_active 
ON exporter_profiles(status, business_name) 
WHERE status = 'ACTIVE';

-- TIN lookup for verification
CREATE INDEX IF NOT EXISTS idx_exporter_profiles_tin_lookup 
ON exporter_profiles(tin, status);

-- Business type filtering
CREATE INDEX IF NOT EXISTS idx_exporter_profiles_business_type 
ON exporter_profiles(business_type, status, created_at DESC);

-- Capital verification tracking
CREATE INDEX IF NOT EXISTS idx_exporter_profiles_capital_verified 
ON exporter_profiles(capital_verified, minimum_capital) 
WHERE status = 'ACTIVE';

-- Pending approvals
CREATE INDEX IF NOT EXISTS idx_exporter_profiles_pending 
ON exporter_profiles(status, created_at) 
WHERE status = 'PENDING_APPROVAL';

-- ============================================================================
-- 2. SALES CONTRACTS - Contract management and tracking
-- ============================================================================

-- Exporter's contracts by status
CREATE INDEX IF NOT EXISTS idx_sales_contracts_exporter_status_date 
ON sales_contracts(exporter_id, status, registration_date DESC);

-- Delivery date tracking
CREATE INDEX IF NOT EXISTS idx_sales_contracts_delivery 
ON sales_contracts(delivery_date, status) 
WHERE status IN ('REGISTERED', 'APPROVED');

-- Contract value analysis
CREATE INDEX IF NOT EXISTS idx_sales_contracts_value_analysis 
ON sales_contracts(coffee_type, contract_value, registration_date DESC) 
WHERE status = 'APPROVED';

-- Buyer country statistics
CREATE INDEX IF NOT EXISTS idx_sales_contracts_buyer_country 
ON sales_contracts(buyer_country, status, registration_date DESC);

-- Pending approvals
CREATE INDEX IF NOT EXISTS idx_sales_contracts_pending_approval 
ON sales_contracts(status, registration_date) 
WHERE status = 'REGISTERED';

-- ============================================================================
-- 3. EXPORT PERMITS - Permit lifecycle management
-- ============================================================================

-- Exporter's permits by status
CREATE INDEX IF NOT EXISTS idx_export_permits_exporter_status_date 
ON export_permits(exporter_id, status, issued_date DESC);

-- Expiring permits (for renewal alerts)
CREATE INDEX IF NOT EXISTS idx_export_permits_expiring 
ON export_permits(valid_until, status, exporter_id) 
WHERE status = 'ISSUED' AND valid_until > CURRENT_DATE AND valid_until < CURRENT_DATE + INTERVAL '30 days';

-- Destination country analysis
CREATE INDEX IF NOT EXISTS idx_export_permits_destination 
ON export_permits(destination_country, status, issued_date DESC);

-- Coffee type and grade analysis
CREATE INDEX IF NOT EXISTS idx_export_permits_coffee_analysis 
ON export_permits(coffee_type, grade, quantity, issued_date DESC) 
WHERE status IN ('ISSUED', 'USED');

-- License and contract tracking
CREATE INDEX IF NOT EXISTS idx_export_permits_license_contract 
ON export_permits(export_license_id, sales_contract_id, status);

-- Lot tracking
CREATE INDEX IF NOT EXISTS idx_export_permits_lot 
ON export_permits(lot_id, status, issued_date DESC);

-- ============================================================================
-- 4. FX APPROVALS - Foreign exchange management (NBE)
-- ============================================================================

-- Export FX tracking
CREATE INDEX IF NOT EXISTS idx_fx_approvals_export_status 
ON fx_approvals(export_id, approval_status, created_at DESC);

-- Pending approvals
CREATE INDEX IF NOT EXISTS idx_fx_approvals_pending 
ON fx_approvals(approval_status, created_at) 
WHERE approval_status = 'pending';

-- Currency and value analysis
CREATE INDEX IF NOT EXISTS idx_fx_approvals_currency_value 
ON fx_approvals(currency, export_value, created_at DESC) 
WHERE approval_status = 'approved';

-- Approval timeline tracking
CREATE INDEX IF NOT EXISTS idx_fx_approvals_timeline 
ON fx_approvals(created_at, approved_at, approval_status);

-- ============================================================================
-- 5. CUSTOMS CLEARANCES - Customs processing
-- ============================================================================

-- Exporter's clearances by status
CREATE INDEX IF NOT EXISTS idx_customs_clearances_exporter_status 
ON customs_clearances(exporter_id, clearance_status, created_at DESC);

-- Pending clearances (3-day target tracking)
CREATE INDEX IF NOT EXISTS idx_customs_clearances_pending 
ON customs_clearances(clearance_status, created_at) 
WHERE clearance_status = 'pending';

-- Declaration tracking
CREATE INDEX IF NOT EXISTS idx_customs_clearances_declaration 
ON customs_clearances(declaration_number, clearance_status);

-- ============================================================================
-- 6. COFFEE LABORATORIES - Laboratory certification
-- ============================================================================

-- Active labs per exporter
CREATE INDEX IF NOT EXISTS idx_coffee_laboratories_exporter_active 
ON coffee_laboratories(exporter_id, status, laboratory_name) 
WHERE status = 'ACTIVE';

-- Certification expiry tracking
CREATE INDEX IF NOT EXISTS idx_coffee_laboratories_cert_expiry 
ON coffee_laboratories(expiry_date, status, exporter_id) 
WHERE status = 'ACTIVE' AND expiry_date IS NOT NULL;

-- Certification number lookup
CREATE INDEX IF NOT EXISTS idx_coffee_laboratories_cert_number 
ON coffee_laboratories(certification_number, status);

-- Inspection tracking
CREATE INDEX IF NOT EXISTS idx_coffee_laboratories_inspection 
ON coffee_laboratories(last_inspection_date, status, exporter_id) 
WHERE status = 'ACTIVE';

-- ============================================================================
-- 7. COFFEE TASTERS - Taster certification
-- ============================================================================

-- Active tasters per exporter
CREATE INDEX IF NOT EXISTS idx_coffee_tasters_exporter_active 
ON coffee_tasters(exporter_id, status, full_name) 
WHERE status = 'ACTIVE';

-- Proficiency certificate lookup
CREATE INDEX IF NOT EXISTS idx_coffee_tasters_certificate 
ON coffee_tasters(proficiency_certificate_number, status);

-- Certificate expiry tracking
CREATE INDEX IF NOT EXISTS idx_coffee_tasters_cert_expiry 
ON coffee_tasters(certificate_expiry_date, status, exporter_id) 
WHERE status = 'ACTIVE' AND certificate_expiry_date IS NOT NULL;

-- ============================================================================
-- 8. EXPORT LICENSES - License management
-- ============================================================================

-- Exporter's licenses by status
CREATE INDEX IF NOT EXISTS idx_export_licenses_exporter_status 
ON export_licenses(exporter_id, license_status, issued_date DESC);

-- Expiring licenses
CREATE INDEX IF NOT EXISTS idx_export_licenses_expiring 
ON export_licenses(expiry_date, license_status, exporter_id) 
WHERE license_status = 'ACTIVE' AND expiry_date > CURRENT_DATE AND expiry_date < CURRENT_DATE + INTERVAL '60 days';

-- License number lookup
CREATE INDEX IF NOT EXISTS idx_export_licenses_number 
ON export_licenses(license_number, license_status);

-- ============================================================================
-- 9. QUALITY INSPECTIONS - Quality control
-- ============================================================================

-- Lot inspections
CREATE INDEX IF NOT EXISTS idx_quality_inspections_lot 
ON quality_inspections(lot_id, inspection_status, inspection_date DESC);

-- Exporter's inspections
CREATE INDEX IF NOT EXISTS idx_quality_inspections_exporter 
ON quality_inspections(exporter_id, inspection_status, inspection_date DESC);

-- Pending inspections
CREATE INDEX IF NOT EXISTS idx_quality_inspections_pending 
ON quality_inspections(inspection_status, inspection_date) 
WHERE inspection_status = 'PENDING';

-- Grade analysis
CREATE INDEX IF NOT EXISTS idx_quality_inspections_grade 
ON quality_inspections(grade, inspection_status, inspection_date DESC) 
WHERE inspection_status = 'PASSED';

-- ============================================================================
-- 10. COFFEE LOTS - Lot tracking
-- ============================================================================

-- Exporter's lots by status
CREATE INDEX IF NOT EXISTS idx_coffee_lots_exporter_status 
ON coffee_lots(exporter_id, lot_status, created_at DESC);

-- Available lots for export
CREATE INDEX IF NOT EXISTS idx_coffee_lots_available 
ON coffee_lots(lot_status, coffee_type, quantity) 
WHERE lot_status = 'AVAILABLE';

-- Coffee type and origin
CREATE INDEX IF NOT EXISTS idx_coffee_lots_type_origin 
ON coffee_lots(coffee_type, origin_region, lot_status, created_at DESC);

-- ============================================================================
-- 11. NOTIFICATIONS - User notifications
-- ============================================================================

-- Unread notifications per user
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON notifications(user_id, created_at DESC) 
WHERE read_at IS NULL;

-- Notification type filtering
CREATE INDEX IF NOT EXISTS idx_notifications_type 
ON notifications(notification_type, user_id, created_at DESC);

-- Priority notifications
CREATE INDEX IF NOT EXISTS idx_notifications_priority 
ON notifications(priority, user_id, created_at DESC) 
WHERE read_at IS NULL;

-- ============================================================================
-- 12. SHIPMENTS - Shipment tracking
-- ============================================================================

-- Exporter's shipments
CREATE INDEX IF NOT EXISTS idx_shipments_exporter_status 
ON shipments(exporter_id, shipment_status, created_at DESC);

-- Permit shipments
CREATE INDEX IF NOT EXISTS idx_shipments_permit 
ON shipments(export_permit_id, shipment_status);

-- Destination tracking
CREATE INDEX IF NOT EXISTS idx_shipments_destination 
ON shipments(destination_port, shipment_status, departure_date DESC);

-- In-transit shipments
CREATE INDEX IF NOT EXISTS idx_shipments_in_transit 
ON shipments(shipment_status, departure_date) 
WHERE shipment_status = 'IN_TRANSIT';

-- ============================================================================
-- 13. CERTIFICATES OF ORIGIN - Certificate management
-- ============================================================================

-- Permit certificates
CREATE INDEX IF NOT EXISTS idx_certificates_origin_permit 
ON certificates_of_origin(export_permit_id, certificate_status);

-- Exporter's certificates
CREATE INDEX IF NOT EXISTS idx_certificates_origin_exporter 
ON certificates_of_origin(exporter_id, certificate_status, issue_date DESC);

-- Certificate number lookup
CREATE INDEX IF NOT EXISTS idx_certificates_origin_number 
ON certificates_of_origin(certificate_number, certificate_status);

-- ============================================================================
-- 14. LICENSE APPLICATIONS - Application processing
-- ============================================================================

-- Exporter's applications
CREATE INDEX IF NOT EXISTS idx_license_applications_exporter 
ON license_applications(exporter_id, application_status, created_at DESC);

-- Pending applications
CREATE INDEX IF NOT EXISTS idx_license_applications_pending 
ON license_applications(application_status, created_at) 
WHERE application_status = 'PENDING';

-- Application type filtering
CREATE INDEX IF NOT EXISTS idx_license_applications_type 
ON license_applications(application_type, application_status, created_at DESC);

-- ============================================================================
-- 15. DOCUMENT VERIFICATIONS - Document processing
-- ============================================================================

-- Pending verifications
CREATE INDEX IF NOT EXISTS idx_document_verifications_pending 
ON document_verifications(verification_status, created_at) 
WHERE verification_status = 'PENDING';

-- Exporter's documents
CREATE INDEX IF NOT EXISTS idx_document_verifications_exporter 
ON document_verifications(exporter_id, verification_status, created_at DESC);

-- Document type filtering
CREATE INDEX IF NOT EXISTS idx_document_verifications_type 
ON document_verifications(document_type, verification_status, created_at DESC);

-- ============================================================================
-- 16. COMPOSITE INDEXES FOR COMPLEX QUERIES
-- ============================================================================

-- Export workflow tracking (permit -> contract -> license)
CREATE INDEX IF NOT EXISTS idx_export_workflow 
ON export_permits(exporter_id, sales_contract_id, export_license_id, status, issued_date DESC);

-- Quality workflow (lot -> inspection -> permit)
CREATE INDEX IF NOT EXISTS idx_quality_workflow 
ON export_permits(lot_id, quality_inspection_id, status, issued_date DESC);

-- Financial workflow (contract -> fx -> customs)
CREATE INDEX IF NOT EXISTS idx_financial_workflow 
ON sales_contracts(exporter_id, contract_value, status, registration_date DESC);

-- ============================================================================
-- 17. STATISTICS AND REPORTING INDEXES
-- ============================================================================

-- Monthly export statistics
CREATE INDEX IF NOT EXISTS idx_export_permits_monthly_stats 
ON export_permits(DATE_TRUNC('month', issued_date), status, coffee_type, quantity);

-- Monthly contract statistics
CREATE INDEX IF NOT EXISTS idx_sales_contracts_monthly_stats 
ON sales_contracts(DATE_TRUNC('month', registration_date), status, coffee_type, contract_value);

-- Exporter performance metrics
CREATE INDEX IF NOT EXISTS idx_exporter_performance 
ON export_permits(exporter_id, status, DATE_TRUNC('month', issued_date), quantity);

-- ============================================================================
-- 18. UPDATE STATISTICS FOR QUERY PLANNER
-- ============================================================================

ANALYZE exporter_profiles;
ANALYZE sales_contracts;
ANALYZE export_permits;
ANALYZE fx_approvals;
ANALYZE customs_clearances;
ANALYZE coffee_laboratories;
ANALYZE coffee_tasters;
ANALYZE export_licenses;
ANALYZE quality_inspections;
ANALYZE coffee_lots;
ANALYZE notifications;
ANALYZE shipments;
ANALYZE certificates_of_origin;
ANALYZE license_applications;
ANALYZE document_verifications;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT 
    'Performance indexes created successfully' as status,
    COUNT(*) as total_indexes
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%';
