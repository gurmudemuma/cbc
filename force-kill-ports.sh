#!/bin/bash

echo "🔪 Force Killing All Processes on API Ports"
echo "============================================"

# Function to force kill processes on a port using netstat and taskkill (Windows)
force_kill_port() {
    local port=$1
    echo "Force killing processes on port $port..."
    
    # Try Windows netstat approach
    if command -v netstat &> /dev/null; then
        # Find PID using netstat (Windows style)
        local pids=$(netstat -ano | grep ":$port " | awk '{print $5}' | sort -u)
        
        for pid in $pids; do
            if [ ! -z "$pid" ] && [ "$pid" != "0" ]; then
                echo "  Found PID $pid using port $port"
                # Use taskkill on Windows
                if command -v taskkill &> /dev/null; then
                    taskkill /F /PID $pid 2>/dev/null || true
                    echo "  Killed PID $pid with taskkill"
                else
                    # Fallback to kill
                    kill -9 $pid 2>/dev/null || true
                    echo "  Killed PID $pid with kill"
                fi
            fi
        done
    fi
    
    # Also try PowerShell approach if available
    if command -v powershell.exe &> /dev/null; then
        echo "  Using PowerShell to kill processes on port $port..."
        powershell.exe -Command "Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id \$_.OwningProcess -Force -ErrorAction SilentlyContinue }" 2>/dev/null || true
    fi
    
    sleep 1
}

# Kill all API ports
for port in 3001 3002 3003 3004; do
    force_kill_port $port
done

echo ""
echo "🧹 Killing all Node.js and npm processes..."

# Kill all node and npm processes (nuclear option)
if command -v taskkill &> /dev/null; then
    taskkill /F /IM node.exe 2>/dev/null || true
    taskkill /F /IM npm.cmd 2>/dev/null || true
    taskkill /F /IM ts-node-dev.exe 2>/dev/null || true
else
    pkill -f node 2>/dev/null || true
    pkill -f npm 2>/dev/null || true
    pkill -f ts-node-dev 2>/dev/null || true
fi

sleep 3

echo ""
echo "✅ Force cleanup complete!"
echo ""
echo "Verifying ports are free..."
for port in 3001 3002 3003 3004; do
    if netstat -ano | grep ":$port " >/dev/null 2>&1; then
        echo "❌ Port $port still in use"
    else
        echo "✅ Port $port is free"
    fi
done

echo ""
echo "Now try starting the API again:"
echo "  npm run dev"
