-- Diagnostic SQL Script: Check Exporter Data
-- Run this to verify if exporter1 has data in the database

-- 1. Check if user exists
SELECT 'User Check' as check_type, * FROM users WHERE username = 'exporter1';

-- 2. Check if exporter profile exists for this user
SELECT 'Profile Check' as check_type, * FROM exporter_profiles WHERE user_id = (SELECT id FROM users WHERE username = 'exporter1');

-- 3. Check laboratories for this exporter
SELECT 'Laboratory Check' as check_type, cl.* 
FROM coffee_laboratories cl
JOIN exporter_profiles ep ON cl.exporter_id = ep.exporter_id
WHERE ep.user_id = (SELECT id FROM users WHERE username = 'exporter1');

-- 4. Check tasters for this exporter
SELECT 'Taster Check' as check_type, ct.* 
FROM coffee_tasters ct
JOIN exporter_profiles ep ON ct.exporter_id = ep.exporter_id
WHERE ep.user_id = (SELECT id FROM users WHERE username = 'exporter1');

-- 5. Check competence certificates for this exporter
SELECT 'Competence Check' as check_type, cc.* 
FROM competence_certificates cc
JOIN exporter_profiles ep ON cc.exporter_id = ep.exporter_id
WHERE ep.user_id = (SELECT id FROM users WHERE username = 'exporter1');

-- 6. Check export licenses for this exporter
SELECT 'License Check' as check_type, el.* 
FROM export_licenses el
JOIN exporter_profiles ep ON el.exporter_id = ep.exporter_id
WHERE ep.user_id = (SELECT id FROM users WHERE username = 'exporter1');

-- 7. Summary of all statuses
SELECT 
    'Status Summary' as check_type,
    ep.business_name,
    ep.status as profile_status,
    (SELECT status FROM coffee_laboratories WHERE exporter_id = ep.exporter_id LIMIT 1) as laboratory_status,
    (SELECT status FROM coffee_tasters WHERE exporter_id = ep.exporter_id LIMIT 1) as taster_status,
    (SELECT status FROM competence_certificates WHERE exporter_id = ep.exporter_id LIMIT 1) as competence_status,
    (SELECT status FROM export_licenses WHERE exporter_id = ep.exporter_id LIMIT 1) as license_status
FROM exporter_profiles ep
WHERE ep.user_id = (SELECT id FROM users WHERE username = 'exporter1');
