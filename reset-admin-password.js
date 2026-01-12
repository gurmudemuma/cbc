const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'coffee_export_db',
    user: 'postgres',
    password: 'postgres'
});

async function resetPassword() {
    const client = await pool.connect();

    try {
        console.log('Resetting admin password...');

        // Hash 'password123'
        const password = 'password123';
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        console.log(`Generated hash for '${password}'`);

        // Update admin user
        const result = await client.query(
            "UPDATE users SET password_hash = $1 WHERE username = 'admin' RETURNING id, username",
            [hash]
        );

        if (result.rows.length > 0) {
            console.log(`✅ Successfully updated password for user: ${result.rows[0].username}`);
        } else {
            console.log('❌ User "admin" not found. Creating it...');
            // Create admin if not exists
            const orgResult = await client.query("SELECT organization_id FROM organizations WHERE code = 'CB' LIMIT 1");
            let orgId;
            if (orgResult.rows.length > 0) {
                orgId = orgResult.rows[0].organization_id;
            } else {
                // Create default org
                const newOrg = await client.query("INSERT INTO organizations (organization_id, name, code, type, created_at) VALUES (gen_random_uuid(), 'Commercial Bank', 'CB', 'BANK', NOW()) RETURNING organization_id");
                orgId = newOrg.rows[0].organization_id;
            }

            await client.query(
                "INSERT INTO users (username, password_hash, email, organization_id, role, created_at, updated_at) VALUES ($1, $2, $3, $4, 'admin', NOW(), NOW())",
                ['admin', hash, 'admin@example.com', orgId]
            );
            console.log('✅ Created "admin" user with password: password123');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        client.release();
        pool.end();
    }
}

resetPassword();
