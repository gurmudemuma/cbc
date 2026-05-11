-- Fix user_network_members table to use integer user_id instead of uuid
ALTER TABLE user_network_members DROP CONSTRAINT IF EXISTS user_network_members_member_id_fkey;
ALTER TABLE user_network_members DROP CONSTRAINT IF EXISTS user_network_members_user_id_member_id_key;
DROP INDEX IF EXISTS idx_user_network_members_user;

-- Drop and recreate the table with correct types
DROP TABLE IF EXISTS user_network_members CASCADE;

CREATE TABLE user_network_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id integer NOT NULL,
    member_id uuid NOT NULL,
    role varchar(50) DEFAULT 'MEMBER',
    is_active boolean DEFAULT true,
    assigned_at timestamp DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, member_id),
    FOREIGN KEY (member_id) REFERENCES network_members(member_id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_user_network_members_user ON user_network_members(user_id);
CREATE INDEX idx_user_network_members_member ON user_network_members(member_id);

-- Now assign users to their respective network members
-- ECTA user -> ECTA member
INSERT INTO user_network_members (user_id, member_id, role)
SELECT 38, member_id, 'ADMIN'
FROM network_members WHERE member_code = 'ECTA';

-- NBE user -> NBE member
INSERT INTO user_network_members (user_id, member_id, role)
SELECT 40, member_id, 'ADMIN'
FROM network_members WHERE member_code = 'NBE';

-- Customs user -> ERCA member
INSERT INTO user_network_members (user_id, member_id, role)
SELECT 39, member_id, 'ADMIN'
FROM network_members WHERE member_code = 'ERCA';

-- ECX user -> ECX member
INSERT INTO user_network_members (user_id, member_id, role)
SELECT 41, member_id, 'ADMIN'
FROM network_members WHERE member_code = 'ECX';

-- Verify the assignments
SELECT 
    u.username,
    u.email,
    u.role as user_role,
    nm.member_code,
    nm.member_name,
    unm.role as network_role
FROM user_network_members unm
JOIN users u ON unm.user_id = u.id
JOIN network_members nm ON unm.member_id = nm.member_id
ORDER BY nm.member_code;
