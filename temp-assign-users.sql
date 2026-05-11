-- Assign users to network members
-- First, ensure we have at least one user
INSERT INTO users (username, email, password_hash, organization_id, role, is_active)
VALUES ('demo_agency', 'demo@agency.gov.et', '$2b$10$dummyhashfordemopurposes', 'ecta', 'agency', true)
ON CONFLICT (email) DO NOTHING;

-- Assign all existing users to all network members (for demo purposes)
INSERT INTO user_network_members (user_id, member_id, role, is_active)
SELECT u.id, nm.member_id, 'MEMBER', true
FROM users u
CROSS JOIN network_members nm
WHERE u.is_active = true
ON CONFLICT (user_id, member_id) DO NOTHING;

SELECT 'Assignments created: ' || COUNT(*)::text as result FROM user_network_members;
