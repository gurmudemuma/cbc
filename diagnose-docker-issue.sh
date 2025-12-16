#!/bin/bash

# Diagnostic script for Docker broken pipe issues

echo "=========================================="
echo "Docker Broken Pipe Diagnostic Report"
echo "=========================================="
echo ""

# 1. Docker daemon status
echo "[1] Docker Daemon Status"
echo "---"
systemctl status docker --no-pager | head -10
echo ""

# 2. Docker socket
echo "[2] Docker Socket"
echo "---"
ls -la /run/docker.sock
echo ""

# 3. Docker info
echo "[3] Docker Info"
echo "---"
docker info 2>&1 | head -30
echo ""

# 4. Docker disk usage
echo "[4] Docker Disk Usage"
echo "---"
docker system df
echo ""

# 5. Running containers
echo "[5] Running Containers"
echo "---"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# 6. Peer logs (last 30 lines)
echo "[6] Peer Logs (peer0.commercialbank)"
echo "---"
docker logs peer0.commercialbank.coffee-export.com 2>&1 | tail -30
echo ""

# 7. Check for resource constraints
echo "[7] System Resources"
echo "---"
echo "Memory:"
free -h | head -2
echo ""
echo "Disk:"
df -h / | tail -1
echo ""
echo "CPU Load:"
uptime
echo ""

# 8. Docker build cache
echo "[8] Docker Build Cache"
echo "---"
docker system df --verbose 2>&1 | grep -A 20 "Build cache"
echo ""

# 9. Check for stuck processes
echo "[9] Docker Processes"
echo "---"
ps aux | grep -E "docker|containerd" | grep -v grep | head -10
echo ""

# 10. Network connectivity
echo "[10] Network Connectivity"
echo "---"
echo "Docker network:"
docker network ls
echo ""
echo "Coffee-export network:"
docker network inspect coffee-export-network 2>&1 | grep -E "Name|Containers" | head -5
echo ""

echo "=========================================="
echo "Diagnostic Report Complete"
echo "=========================================="
echo ""
echo "Common Issues and Solutions:"
echo ""
echo "1. BROKEN PIPE during docker build:"
echo "   - Restart Docker: sudo systemctl restart docker"
echo "   - Clean up: docker system prune -f --volumes"
echo "   - Check disk space: df -h"
echo ""
echo "2. Docker daemon not responding:"
echo "   - Check status: systemctl status docker"
echo "   - Restart: sudo systemctl restart docker"
echo "   - Check logs: journalctl -u docker -n 50"
echo ""
echo "3. Socket permission issues:"
echo "   - Verify user in docker group: groups \$USER"
echo "   - Add user: sudo usermod -aG docker \$USER"
echo "   - Restart: newgrp docker"
echo ""
