# Quick Start Guide

## 🚀 Start the System
```bash
cd /home/gu-da/cbc
./scripts/start.sh
```

## 🔑 Login Credentials
| Organization | Username | Password |
|-------------|----------|----------|
| Commercial Bank | export_user | Export123!@# |
| National Bank | bank_user | Bank123!@# |
| ECTA | ecta_user | Ecta123!@# |
| Shipping Line | ship_user | Ship123!@# |
| Custom Authorities | customs_user | Customs123!@# |

## 🌐 Access Points
- **Frontend:** Check start.sh output for IP (e.g., http://172.18.0.19/)
- **APIs:** Ports 3001-3006 on container IPs

## 🔧 Common Commands
```bash
# View logs
docker logs <container-name>

# Restart service
docker-compose restart <service-name>

# Stop system
docker-compose down

# Register users manually
./scripts/register-working-users.sh

# Check container IPs
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' <container-name>
```

## 📊 System Status
```bash
# Check all containers
docker ps

# Check APIs
docker ps | grep api

# Check blockchain
docker ps | grep peer
```

## 🆘 Troubleshooting
1. **APIs not responding:** Check container IPs changed after restart
2. **Frontend not loading:** Restart frontend container
3. **Login fails:** Verify API is accessible at container IP
4. **Build fails:** Run `npm install` in apis/ and frontend/

## 📚 Full Documentation
- See `DEPLOYMENT_GUIDE.md` for complete details
- See `SYSTEM_ARCHITECTURE.md` for architecture overview
- See `frontend/IMPROVEMENTS.md` for UI changes
