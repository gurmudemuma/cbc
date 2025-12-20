# Quick Start Guide - Coffee Export Consortium System

## 🚀 Getting Started in 5 Minutes

### Prerequisites
```bash
# Check Node.js version (16+)
node --version

# Check PostgreSQL version (12+)
psql --version

# Check Redis version (6+)
redis-cli --version
```

### 1. Clone & Install
```bash
cd /home/gu-da/cbc
npm install
```

### 2. Setup Environment
```bash
# Copy environment template
cp .env.template .env

# Edit .env with your values
nano .env
```

### 3. Setup Database
```bash
# Create database
createdb cbc

# Run migrations
npm run migrate

# Seed initial data (optional)
npm run seed
```

### 4. Start Services
```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

### 5. Verify Installation
```bash
# Check API health
curl http://localhost:3000/health

# Check database connection
curl http://localhost:3000/api/health/db

# Check Redis connection
curl http://localhost:3000/api/health/redis
```

---

## 📋 Common Tasks

### Create a New Export
```bash
curl -X POST http://localhost:3000/api/exports \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "exporter_name": "Coffee Exporter Ltd",
    "coffee_type": "Arabica Grade 2",
    "quantity": 5000,
    "destination_country": "USA"
  }'
```

### Get Export Status
```bash
curl http://localhost:3000/api/exports/EXP-123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Approve Quality
```bash
curl -X POST http://localhost:3000/api/quality/EXP-123/approve \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quality_grade": "Grade 1"
  }'
```

### Approve FX
```bash
curl -X POST http://localhost:3000/api/fx/EXP-123/approve \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "approval_notes": "FX approved"
  }'
```

---

## 🔐 Authentication

### Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user@example.com",
    "password": "SecurePassword123",
    "email": "user@example.com",
    "role": "exporter"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user@example.com",
    "password": "SecurePassword123"
  }'
```

### Refresh Token
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_CURRENT_TOKEN"
  }'
```

---

## 🗄️ Database Commands

### Connect to Database
```bash
psql -U postgres -d cbc
```

### View Exports
```sql
SELECT * FROM exports;
```

### View Export History
```sql
SELECT * FROM export_status_history WHERE export_id = 'EXP-123';
```

### View Users
```sql
SELECT id, username, email, role FROM users;
```

### View Approvals
```sql
SELECT * FROM export_approvals WHERE export_id = 'EXP-123';
```

---

## 📊 Monitoring

### Check Application Logs
```bash
# View recent logs
tail -f logs/application.log

# View error logs
tail -f logs/error.log

# Search for specific error
grep "ERROR" logs/application.log
```

### Check Database Performance
```bash
# Connect to database
psql -U postgres -d cbc

# View slow queries
SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;

# View table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Check Redis Cache
```bash
# Connect to Redis
redis-cli

# View cache keys
KEYS *

# View cache size
DBSIZE

# Clear cache
FLUSHDB
```

---

## 🐛 Troubleshooting

### Issue: Database Connection Failed
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### Issue: Redis Connection Failed
```bash
# Check Redis is running
sudo systemctl status redis-server

# Test connection
redis-cli ping

# Check Redis logs
tail -f /var/log/redis/redis-server.log
```

### Issue: Authentication Failed
```bash
# Check JWT secret is set
echo $JWT_SECRET

# Check token expiration
# Decode JWT at jwt.io

# Refresh token
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"token": "YOUR_TOKEN"}'
```

### Issue: Export Not Found
```bash
# Check export exists
psql -U postgres -d cbc -c "SELECT * FROM exports WHERE id = 'EXP-123';"

# Check export history
psql -U postgres -d cbc -c "SELECT * FROM export_status_history WHERE export_id = 'EXP-123';"
```

---

## 📈 Performance Tips

### 1. Enable Query Caching
```bash
# Set Redis TTL in .env
CACHE_TTL=3600
```

### 2. Optimize Database
```sql
-- Create indexes
CREATE INDEX idx_exports_status ON exports(status);
CREATE INDEX idx_exports_created_at ON exports(created_at);
CREATE INDEX idx_export_history_export_id ON export_status_history(export_id);
```

### 3. Monitor Connections
```bash
# Check active connections
psql -U postgres -d cbc -c "SELECT count(*) FROM pg_stat_activity;"
```

---

## 🔄 Backup & Recovery

### Backup Database
```bash
# Full backup
pg_dump -U postgres cbc > backup.sql

# Compressed backup
pg_dump -U postgres cbc | gzip > backup.sql.gz

# Scheduled backup (cron)
0 2 * * * pg_dump -U postgres cbc | gzip > /backups/cbc_$(date +\%Y\%m\%d).sql.gz
```

### Restore Database
```bash
# From SQL file
psql -U postgres cbc < backup.sql

# From compressed file
gunzip -c backup.sql.gz | psql -U postgres cbc
```

### Backup Redis Cache
```bash
# Manual backup
redis-cli BGSAVE

# Check backup
ls -la /var/lib/redis/dump.rdb
```

---

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication Header
```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Response Format
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  }
}
```

---

## 🚀 Deployment

### Deploy to Staging
```bash
# Build
npm run build

# Run tests
npm test

# Deploy
npm run deploy:staging
```

### Deploy to Production
```bash
# Build
npm run build

# Run tests
npm test

# Create backup
npm run backup

# Deploy
npm run deploy:production
```

---

## 📞 Support

### Getting Help
1. Check logs: `tail -f logs/application.log`
2. Check database: `psql -U postgres -d cbc`
3. Check Redis: `redis-cli`
4. Review documentation
5. Contact support team

### Useful Commands
```bash
# View all services
systemctl list-units --type=service

# Restart services
sudo systemctl restart postgresql
sudo systemctl restart redis-server

# View system logs
journalctl -u postgresql -f
journalctl -u redis-server -f

# Check disk space
df -h

# Check memory usage
free -h
```

---

## ✅ Verification Checklist

- [ ] Node.js installed (16+)
- [ ] PostgreSQL installed (12+)
- [ ] Redis installed (6+)
- [ ] Environment variables set
- [ ] Database created
- [ ] Migrations run
- [ ] Application starts
- [ ] Health check passes
- [ ] Can create export
- [ ] Can approve export
- [ ] Logs are being written
- [ ] Cache is working

---

## 🎯 Next Steps

1. **Read Documentation**
   - COMPREHENSIVE_SYSTEM_ANALYSIS.md
   - API_DOCUMENTATION.md

2. **Run Tests**
   ```bash
   npm test
   ```

3. **Deploy**
   ```bash
   npm run deploy
   ```

4. **Monitor**
   - Check logs regularly
   - Monitor database performance
   - Monitor cache hit rates

5. **Maintain**
   - Regular backups
   - Security updates
   - Performance optimization

---

**Status**: ✅ Ready to Use
**Version**: 1.0.0
**Last Updated**: 2024
