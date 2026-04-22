# Quick Deployment Reference Card

## One-Command Deployment

### Windows
```bash
DEPLOY-ALL.bat
```

### Linux/Mac
```bash
chmod +x DEPLOY-ALL.sh && ./DEPLOY-ALL.sh
```

---

## Check Status
```bash
CHECK-DEPLOYMENT-STATUS.bat  # Windows
docker ps                     # All platforms
```

---

## Access Points

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:3000 |
| CouchDB | http://localhost:5984/_utils |

---

## Login Credentials

```
Admin:     admin / admin123
Exporter:  exporter1 / password123
```

---

## Quick Commands

### View Logs
```bash
docker-compose -f docker-compose-hybrid.yml logs -f
```

### Stop System
```bash
docker-compose -f docker-compose-hybrid.yml down
docker-compose -f docker-compose-fabric.yml down
```

### Restart Service
```bash
docker-compose -f docker-compose-hybrid.yml restart <service-name>
```

### Check Blockchain
```bash
docker exec cli peer channel getinfo -c coffeechannel
```

### Check Database
```bash
docker-compose -f docker-compose-hybrid.yml exec postgres psql -U postgres -d coffee_export_db
```

---

## Troubleshooting

### Containers Not Starting
```bash
docker logs <container-name>
```

### Port Conflict
```bash
docker ps  # Check what's using ports
```

### Redeploy Chaincode
```bash
cd scripts && ./deploy-chaincode.bat
```

### Restart PostgreSQL
```bash
docker-compose -f docker-compose-hybrid.yml restart postgres
```

---

## Expected Results

- **Containers**: ~25 running
- **Ports**: 5173 (frontend), 3000 (API), 5432 (DB)
- **Login**: Should work with admin/admin123
- **Performance**: Queries <50ms

---

## Support

1. Check `DEPLOYMENT-PLAN.md` for detailed guide
2. Check `DEPLOYMENT-SUMMARY.md` for overview
3. View logs: `docker logs <container-name>`
4. Check status: `docker ps`

---

**Deployment Time**: 10-15 minutes  
**System**: Hybrid Blockchain (Fabric + PostgreSQL)  
**Components**: 25+ containers, 10+ services
