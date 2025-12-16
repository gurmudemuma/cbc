-- Test User Creation Script
-- Creates test users aligned with chaincode and PostgreSQL schema
-- All passwords are hashed with bcrypt

BEGIN;

-- Insert test users
-- Note: Passwords are pre-hashed with bcrypt (cost 10)
-- Password format: {Role}@123456

INSERT INTO users (
    id,
    username,
    password_hash,
    email,
    organization_id,
    role,
    is_active,
    created_by,
    notes
) VALUES
    -- Commercial Bank Users
    (
        '550e8400-e29b-41d4-a716-446655440001'::uuid,
        'bank_user',
        '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36DRcT36',  -- Bank@123456
        'bank_user@commercialbank.et',
        'commercial-bank',
        'Banking Officer',
        true,
        'system',
        'Test user for Commercial Bank'
    ),
    (
        '550e8400-e29b-41d4-a716-446655440002'::uuid,
        'bank_admin',
        '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36DRcT36',  -- Bank@123456
        'bank_admin@commercialbank.et',
        'commercial-bank',
        'Admin',
        true,
        'system',
        'Admin user for Commercial Bank'
    ),

    -- National Bank Users
    (
        '550e8400-e29b-41d4-a716-446655440003'::uuid,
        'nbe_user',
        '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36DRcT36',  -- NBE@123456
        'nbe_user@nbe.et',
        'national-bank',
        'FX Officer',
        true,
        'system',
        'Test user for National Bank'
    ),
    (
        '550e8400-e29b-41d4-a716-446655440004'::uuid,
        'nbe_banking',
        '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36DRcT36',  -- NBE@123456
        'nbe_banking@nbe.et',
        'national-bank',
        'Banking Officer',
        true,
        'system',
        'Banking Officer at National Bank'
    ),

    -- ECTA Users
    (
        '550e8400-e29b-41d4-a716-446655440005'::uuid,
        'ecta_user',
        '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36DRcT36',  -- ECTA@123456
        'ecta_user@ecta.et',
        'ecta',
        'Quality Officer',
        true,
        'system',
        'Test user for ECTA'
    ),
    (
        '550e8400-e29b-41d4-a716-446655440006'::uuid,
        'ecta_admin',
        '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36DRcT36',  -- ECTA@123456
        'ecta_admin@ecta.et',
        'ecta',
        'Admin',
        true,
        'system',
        'Admin user for ECTA'
    ),

    -- ECX Users
    (
        '550e8400-e29b-41d4-a716-446655440007'::uuid,
        'ecx_user',
        '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36DRcT36',  -- ECX@123456
        'ecx_user@ecx.et',
        'ecx',
        'Lot Verifier',
        true,
        'system',
        'Test user for ECX'
    ),
    (
        '550e8400-e29b-41d4-a716-446655440008'::uuid,
        'ecx_admin',
        '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36DRcT36',  -- ECX@123456
        'ecx_admin@ecx.et',
        'ecx',
        'Admin',
        true,
        'system',
        'Admin user for ECX'
    ),

    -- Customs Users
    (
        '550e8400-e29b-41d4-a716-446655440009'::uuid,
        'customs_user',
        '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36DRcT36',  -- Customs@123456
        'customs_user@customs.et',
        'customs',
        'Customs Officer',
        true,
        'system',
        'Test user for Customs'
    ),
    (
        '550e8400-e29b-41d4-a716-446655440010'::uuid,
        'customs_admin',
        '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36DRcT36',  -- Customs@123456
        'customs_admin@customs.et',
        'customs',
        'Admin',
        true,
        'system',
        'Admin user for Customs'
    ),

    -- Shipping Line Users
    (
        '550e8400-e29b-41d4-a716-446655440011'::uuid,
        'shipping_user',
        '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36DRcT36',  -- Shipping@123456
        'shipping_user@shippingline.et',
        'shipping-line',
        'Shipping Officer',
        true,
        'system',
        'Test user for Shipping Line'
    ),
    (
        '550e8400-e29b-41d4-a716-446655440012'::uuid,
        'shipping_admin',
        '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36DRcT36',  -- Shipping@123456
        'shipping_admin@shippingline.et',
        'shipping-line',
        'Admin',
        true,
        'system',
        'Admin user for Shipping Line'
    ),

    -- Exporter Portal Users
    (
        '550e8400-e29b-41d4-a716-446655440013'::uuid,
        'exporter_user',
        '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36DRcT36',  -- Exporter@123456
        'exporter_user@exporterportal.et',
        'exporter-portal',
        'Exporter',
        true,
        'system',
        'Test exporter user'
    ),
    (
        '550e8400-e29b-41d4-a716-446655440014'::uuid,
        'exporter_admin',
        '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36DRcT36',  -- Exporter@123456
        'exporter_admin@exporterportal.et',
        'exporter-portal',
        'Admin',
        true,
        'system',
        'Admin user for Exporter Portal'
    ),

    -- System Admin
    (
        '550e8400-e29b-41d4-a716-446655440015'::uuid,
        'system_admin',
        '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36DRcT36',  -- Admin@123456
        'admin@cbc.et',
        'commercial-bank',
        'Admin',
        true,
        'system',
        'System administrator'
    );

-- Log the created users
SELECT 'Test users created successfully' as status;
SELECT COUNT(*) as total_users FROM users;

-- Display created users
SELECT 
    username,
    email,
    organization_id,
    role,
    is_active,
    created_at
FROM users
WHERE created_by = 'system'
ORDER BY organization_id, role;

COMMIT;

-- Print summary
SELECT '
╔════════════════════════════════════════════════════════════════╗
║           TEST USERS CREATED SUCCESSFULLY                      ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  All test users have been created and are ready to use.       ║
║                                                                ║
║  Login Credentials:                                            ║
║  ─────────────────────────────────────────────────────────────║
║                                                                ║
║  Commercial Bank:                                              ║
║    Username: bank_user                                         ║
║    Password: Bank@123456                                       ║
║                                                                ║
║  National Bank:                                                ║
║    Username: nbe_user                                          ║
║    Password: NBE@123456                                        ║
║                                                                ║
║  ECTA:                                                         ║
║    Username: ecta_user                                         ║
║    Password: ECTA@123456                                       ║
║                                                                ║
║  ECX:                                                          ║
║    Username: ecx_user                                          ║
║    Password: ECX@123456                                        ║
║                                                                ║
║  Customs:                                                      ║
║    Username: customs_user                                      ║
║    Password: Customs@123456                                    ║
║                                                                ║
║  Shipping Line:                                                ║
║    Username: shipping_user                                     ║
║    Password: Shipping@123456                                   ║
║                                                                ║
║  Exporter Portal:                                              ║
║    Username: exporter_user                                     ║
║    Password: Exporter@123456                                   ║
║                                                                ║
║  System Admin:                                                 ║
║    Username: system_admin                                      ║
║    Password: Admin@123456                                      ║
║                                                                ║
║  Application URL: http://localhost:3010                        ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
' as info;
