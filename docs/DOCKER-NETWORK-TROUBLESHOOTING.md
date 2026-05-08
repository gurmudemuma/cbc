# Docker Network Troubleshooting

## Problem: "No such host" / "dial tcp: lookup registry-1.docker.io: no such host"

This error means Docker can't reach Docker Hub to pull base images.

## Solutions

### Solution 1: Pre-Pull Images (Recommended)

When you have internet connectivity, run:

**Windows:**
```bash
scripts/prepare-images.bat
```

**Linux/Mac:**
```bash
bash scripts/prepare-images.sh
```

This downloads all required images. Then you can run the startup script without internet.

### Solution 2: Check Docker Network

Verify Docker has internet access:

```bash
docker run --rm alpine ping -c 1 8.8.8.8
```

If this fails, Docker can't reach the internet. Check:
- Docker Desktop network settings
- Firewall rules
- Proxy settings

### Solution 3: Configure Docker Proxy

If behind a corporate proxy, configure Docker:

**Windows (Docker Desktop):**
1. Settings → Resources → Proxies
2. Enter proxy details
3. Apply & Restart

**Linux:**
Edit `/etc/docker/daemon.json`:
```json
{
  "proxies": {
    "default": {
      "httpProxy": "http://proxy.example.com:8080",
      "httpsProxy": "https://proxy.example.com:8080",
      "noProxy": "localhost,127.0.0.1"
    }
  }
}
```

Then restart Docker:
```bash
sudo systemctl restart docker
```

### Solution 4: Use Local Registry

If you have a local Docker registry, configure it in docker-compose files:

```yaml
services:
  gateway:
    image: local-registry:5000/gateway:latest
```

## Startup Script Behavior

The startup script now:
1. Tries to start services without building (`--remove-orphans`)
2. If that fails, retries with build (`--build`)
3. Waits 30 seconds for services to initialize
4. Checks if gateway is actually running
5. Provides helpful error messages

## Manual Image Building

If you need to build images locally:

```bash
# Build gateway
docker build -t cbc-gateway:latest ./coffee-export-gateway

# Build buyer-verification
docker build -t cbc-buyer-verification:latest ./services/buyer-verification

# Build blockchain-bridge
docker build -t cbc-blockchain-bridge:latest ./services/blockchain-bridge
```

Then update docker-compose-hybrid.yml to use these images instead of building.

## Checking Image Status

```bash
# List all images
docker images

# Check if specific image exists
docker images | grep node:20-alpine

# Remove unused images
docker image prune -a
```

## Network Diagnostics

```bash
# Test Docker Hub connectivity
docker run --rm alpine wget -O- https://registry-1.docker.io/v2/

# Check Docker network
docker network ls

# Inspect fabric-network
docker network inspect fabric-network
```
