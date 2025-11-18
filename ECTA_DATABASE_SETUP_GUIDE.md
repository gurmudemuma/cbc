# ECTA Pre-Registration Database Setup Guide

## Prerequisites

- PostgreSQL 12+ installed
- Node.js 16+ with npm
- Access to PostgreSQL server

---

## Step 1: Install PostgreSQL Dependencies

Add `pg` package to each API that needs database access:

```bash
# Navigate to shared API folder
cd /home/gu-da/cbc/api

# Install pg for all services
npm install pg @types/pg

# Or install individually for each service
cd /home/gu-da/cbc/api/ecta
npm install pg @types/pg

cd /home/gu-da/cbc/api/exporter-portal
npm install pg @types/pg

cd /home/gu-da/cbc/api/commercial-bank
npm install pg @types/pg
```

---

## Step 2: Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE coffee_export_db;

# Connect to the database
\c coffee_export_db

# Verify connection
\conninfo
```

---

## Step 3: Run Database Migration

```bash
# From the project root
cd /home/gu-da/cbc

# Run the migration script
psql -U postgres -d coffee_export_db -f api/shared/database/migrations/001_create_ecta_preregistration_tables.sql
```

**Or manually:**

```bash
# Copy the SQL file content and execute in psql
psql -U postgres -d coffee_export_db

# Then paste the SQL content from:
# /home/gu-da/cbc/api/shared/database/migrations/001_create_ecta_preregistration_tables.sql
```

---

## Step 4: Verify Tables Created

```sql
-- List all tables
\dt

-- Expected tables:
-- exporter_profiles
-- coffee_laboratories
-- coffee_tasters
-- competence_certificates
-- export_licenses
-- coffee_lots
-- quality_inspections
-- sales_contracts
-- export_permits
-- certificates_of_origin

-- Check table structure
\d exporter_profiles

-- Check views
\dv

-- Expected views:
-- qualified_exporters
-- export_ready_lots
```

---

## Step 5: Configure Environment Variables

Create `.env` file in each API service:

**ECTA API** (`/home/gu-da/cbc/api/ecta/.env`):
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=coffee_export_db
DB_USER=postgres
DB_PASSWORD=your_password_here

# Existing ECTA config...
PORT=3003
NODE_ENV=development
```

**Exporter Portal API** (`/home/gu-da/cbc/api/exporter-portal/.env`):
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=coffee_export_db
DB_USER=postgres
DB_PASSWORD=your_password_here

# Existing config...
PORT=3007
NODE_ENV=development
```

**Commercial Bank API** (`/home/gu-da/cbc/api/commercial-bank/.env`):
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=coffee_export_db
DB_USER=postgres
DB_PASSWORD=your_password_here

# Existing config...
PORT=3001
NODE_ENV=development
```

---

## Step 6: Update API Server Files

### ECTA API

Update `/home/gu-da/cbc/api/ecta/src/index.ts`:

```typescript
import preregistrationRoutes from './routes/preregistration.routes';

// Add route
app.use('/api/ecta/preregistration', preregistrationRoutes);
```

### Exporter Portal API

Update `/home/gu-da/cbc/api/exporter-portal/src/index.ts`:

```typescript
import preregistrationRoutes from './routes/preregistration.routes';

// Add route
app.use('/api/exporter', preregistrationRoutes);
```

---

## Step 7: Test Database Connection

Create a test script `/home/gu-da/cbc/api/shared/database/test-connection.ts`:

```typescript
import pool from './db.config';

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    
    const result = await client.query('SELECT NOW()');
    console.log('✅ Current time from database:', result.rows[0].now);
    
    // Test table exists
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('✅ Tables found:', tables.rows.length);
    tables.rows.forEach(row => console.log('  -', row.table_name));
    
    client.release();
    await pool.end();
    
    console.log('✅ All tests passed!');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

testConnection();
```

Run test:
```bash
cd /home/gu-da/cbc/api/shared/database
npx ts-node test-connection.ts
```

---

## Step 8: Seed Initial Data (Optional)

Create seed data for testing:

```sql
-- Insert test exporter profile
INSERT INTO exporter_profiles (
  user_id, business_name, tin, registration_number, business_type,
  minimum_capital, capital_verified, office_address, city, region,
  contact_person, email, phone, status
) VALUES (
  'test-user-1',
  'Test Coffee Exporters PLC',
  'TIN-001-2024',
  'REG-001-2024',
  'PRIVATE',
  15000000.00,
  true,
  '123 Coffee Street',
  'Addis Ababa',
  'Addis Ababa',
  'John Doe',
  'john@testexporter.com',
  '+251911234567',
  'ACTIVE'
);

-- Verify
SELECT * FROM exporter_profiles;
```

---

## Step 9: API Endpoints Testing

### Test ECTA Endpoints

```bash
# Get all exporters
curl http://localhost:3003/api/ecta/preregistration/exporters

# Get pending applications
curl http://localhost:3003/api/ecta/preregistration/exporters/pending

# Approve exporter
curl -X POST http://localhost:3003/api/ecta/preregistration/exporters/{exporterId}/approve \
  -H "Content-Type: application/json" \
  -d '{"approvedBy": "ECTA Officer"}'
```

### Test Exporter Portal Endpoints

```bash
# Register profile
curl -X POST http://localhost:3007/api/exporter/profile/register \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "New Coffee Exporter",
    "tin": "TIN-002-2024",
    "registrationNumber": "REG-002-2024",
    "businessType": "PRIVATE",
    "minimumCapital": 15000000,
    "officeAddress": "456 Export Ave",
    "city": "Addis Ababa",
    "region": "Addis Ababa",
    "contactPerson": "Jane Smith",
    "email": "jane@newexporter.com",
    "phone": "+251922345678"
  }'

# Check qualification status
curl http://localhost:3007/api/exporter/qualification-status
```

---

## Step 10: Database Maintenance

### Backup Database

```bash
# Full backup
pg_dump -U postgres coffee_export_db > backup_$(date +%Y%m%d).sql

# Backup specific tables
pg_dump -U postgres -t exporter_profiles -t export_licenses coffee_export_db > ecta_backup.sql
```

### Restore Database

```bash
psql -U postgres coffee_export_db < backup_20241111.sql
```

### Monitor Database

```sql
-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check active connections
SELECT * FROM pg_stat_activity WHERE datname = 'coffee_export_db';

-- Check slow queries
SELECT pid, now() - query_start as duration, query 
FROM pg_stat_activity 
WHERE state = 'active' AND now() - query_start > interval '5 seconds';
```

---

## Troubleshooting

### Issue: Cannot connect to database

**Solution:**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Check port
sudo netstat -plnt | grep 5432
```

### Issue: Permission denied

**Solution:**
```sql
-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE coffee_export_db TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
```

### Issue: Table already exists

**Solution:**
```sql
-- Drop all tables (CAUTION: This deletes all data)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;

-- Then re-run migration
```

### Issue: Connection pool exhausted

**Solution:**
```typescript
// Increase pool size in db.config.ts
const pool = new Pool({
  // ...
  max: 50, // Increase from 20
  idleTimeoutMillis: 60000, // Increase timeout
});
```

---

## Performance Optimization

### Add Indexes for Common Queries

```sql
-- Already created in migration, but can add more:

-- Index for exporter lookup by TIN
CREATE INDEX IF NOT EXISTS idx_exporter_tin_lookup ON exporter_profiles(tin) WHERE status = 'ACTIVE';

-- Index for license expiry checks
CREATE INDEX IF NOT EXISTS idx_license_expiry ON export_licenses(expiry_date) WHERE status = 'ACTIVE';

-- Index for quality inspection lookups
CREATE INDEX IF NOT EXISTS idx_quality_cert_lookup ON quality_inspections(quality_certificate_number);
```

### Analyze Query Performance

```sql
-- Explain query plan
EXPLAIN ANALYZE 
SELECT * FROM qualified_exporters WHERE is_qualified = true;

-- Update statistics
ANALYZE exporter_profiles;
ANALYZE export_licenses;
```

---

## Security Best Practices

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Use strong passwords** - Minimum 16 characters
3. **Limit database user permissions** - Create separate users for each service
4. **Enable SSL connections** - For production
5. **Regular backups** - Automated daily backups
6. **Monitor access logs** - Track database access

---

## Next Steps

1. ✅ Database schema created
2. ✅ Repository layer implemented
3. ✅ Service layer connected to database
4. ✅ API routes created
5. ⏳ Install `pg` package
6. ⏳ Configure environment variables
7. ⏳ Wire up routes in server files
8. ⏳ Test API endpoints
9. ⏳ Build frontend UI
10. ⏳ End-to-end testing

---

## Support

For issues or questions:
- Check PostgreSQL logs: `/var/log/postgresql/`
- Review migration file: `/home/gu-da/cbc/api/shared/database/migrations/001_create_ecta_preregistration_tables.sql`
- Test connection: Run test-connection.ts script
- Verify environment variables: Check `.env` files
