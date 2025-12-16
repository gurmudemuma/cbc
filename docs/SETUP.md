# Developer Setup Guide

## Prerequisites Installation

### 1. Docker & Docker Compose
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Node.js 18+
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 3. Go 1.21+
```bash
wget https://go.dev/dl/go1.21.0.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.21.0.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc
```

## Project Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd cbc
```

### 2. Install Dependencies
```bash
# Root dependencies
npm install

# API dependencies
cd apis
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### 3. Generate Secrets
```bash
./scripts/generate-strong-secrets.sh
```

### 4. Configure Environment
```bash
# Copy example env files
cp .env.example .env
cp frontend/.env.example frontend/.env

# Edit as needed
nano .env
```

### 5. Start Network
```bash
./scripts/start.sh
```

## Verification

### Check Services
```bash
docker-compose ps
```

### Test APIs
```bash
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
```

### Access Frontend
Open http://localhost:3000

## Development Workflow

### Start Individual API
```bash
cd apis/commercial-bank
npm run dev
```

### Run Tests
```bash
npm test
```

### View Logs
```bash
docker-compose logs -f [service-name]
```

## Troubleshooting

### Port Conflicts
```bash
./force-kill-ports.sh
```

### Clean Restart
```bash
./cleanup-system.sh
./scripts/start.sh
```

### Network Issues
```bash
./diagnose-api-issues.sh
```
