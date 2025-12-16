# Quick Fix Reference Card

## 🚨 Critical Fixes - Apply Immediately

### Fix 1: Chaincode Access Control (2 hours)
```bash
cd /home/gu-da/cbc
cp chaincode/coffee-export/contract_fixed.go chaincode/coffee-export/contract.go
cd chaincode/coffee-export && go build
cd ../../network && ./scripts/deployCC.sh coffee-export 2.0
```

### Fix 2: Database Indexes (15 minutes)
```bash
docker exec -it postgres psql -U postgres -d coffee_export_db \
  -f /docker-entrypoint-initdb.d/010_performance_indexes.sql
```

### Fix 3: JWT Security (1 hour)
```bash
# Generate keys
openssl genrsa -out jwt-private.pem 2048
openssl rsa -in jwt-private.pem -pubout -out jwt-public.pem

# Update .env files
JWT_PRIVATE_KEY=$(awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' jwt-private.pem)
JWT_PUBLIC_KEY=$(awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' jwt-public.pem)

# Add to all API .env files
for api in commercial-bank national-bank ecta ecx shipping-line custom-authorities; do
  echo "JWT_PRIVATE_KEY=\"$JWT_PRIVATE_KEY\"" >> apis/$api/.env
  echo "JWT_PUBLIC_KEY=\"$JWT_PUBLIC_KEY\"" >> apis/$api/.env
done

# Update middleware
cp apis/shared/middleware/auth-fixed.ts apis/shared/middleware/auth.ts

# Restart
./restart-apis.sh
```

### Fix 4: Resource Limits (5 minutes)
```bash
# Edit docker-compose.yml - change peer memory limits from 2G to 4G
sed -i 's/memory: 2G/memory: 4G/g' docker-compose.yml

# Restart
docker-compose down && docker-compose up -d
```

---

## ✅ Verification Commands

### Check Chaincode
```bash
docker exec cli peer chaincode query -C coffee-export-channel -n coffee-export \
  -c '{"function":"GetExport","Args":["EXP001"]}'
```

### Check Database Indexes
```bash
docker exec postgres psql -U postgres -d coffee_export_db -c "\di" | grep idx_
```

### Check JWT
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}' | jq .
```

### Check Resources
```bash
docker stats --no-stream
```

---

## 🔧 Troubleshooting

### Chaincode deployment fails
```bash
# Check peer logs
docker logs peer0.commercialbank.coffee-export.com

# Retry deployment
cd network && ./retry-chaincode-deployment.sh
```

### Database connection fails
```bash
# Check PostgreSQL
docker exec postgres pg_isready

# Restart if needed
docker-compose restart postgres
```

### API not responding
```bash
# Check logs
docker-compose logs -f commercial-bank-api

# Restart
./restart-apis.sh
```

---

## 📊 Health Check

```bash
# All services
docker-compose ps

# Blockchain health
curl http://localhost:3001/health | jq .

# Database health
docker exec postgres psql -U postgres -c "SELECT version();"
```

---

## 🎯 Priority Order

1. ⚠️ **CRITICAL** - Chaincode access control (security risk)
2. ⚠️ **CRITICAL** - JWT security (authentication risk)
3. ⚠️ **HIGH** - Database indexes (performance issue)
4. ⚠️ **MEDIUM** - Resource limits (stability issue)

---

## 📞 Emergency Contacts

- **Blockchain Issues:** Check `/logs/` directory
- **Database Issues:** `docker logs postgres`
- **API Issues:** `docker-compose logs -f [service-name]`

---

## 🔄 Rollback

If something goes wrong:
```bash
# Rollback chaincode
cd network && ./scripts/deployCC.sh coffee-export 1.0

# Rollback database
docker exec postgres psql -U postgres -d coffee_export_db \
  -c "DROP INDEX IF EXISTS idx_sales_contracts_settlement_deadline;"

# Rollback JWT
git checkout apis/shared/middleware/auth.ts
./restart-apis.sh

# Rollback resources
git checkout docker-compose.yml
docker-compose down && docker-compose up -d
```

---

**Total Time Required:** ~4 hours  
**Risk Level:** LOW (all fixes are non-breaking)  
**Downtime Required:** ~15 minutes (for chaincode deployment)
