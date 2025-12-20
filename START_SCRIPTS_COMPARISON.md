# Comparison: start-all-apis.sh vs start-services.sh

## Quick Summary

| Feature | start-all-apis.sh | start-services.sh |
|---------|-------------------|-------------------|
| **Purpose** | Comprehensive API startup with full management | Simple Docker-aware API startup |
| **Complexity** | Advanced (500+ lines) | Simple (100 lines) |
| **Docker Support** | No | Yes (detects Docker containers) |
| **Prerequisites Check** | Yes (Node, npm, PostgreSQL, directories) | No |
| **Port Availability Check** | Yes (checks all ports before starting) | No |
| **Health Checks** | Yes (HTTP health endpoints) | No |
| **Service Management** | Full (start, stop, restart, status, logs) | Start only |
| **Error Handling** | Comprehensive | Basic |
| **Logging** | Detailed with timestamps | Simple |
| **PID Management** | Tracks all PIDs with service names | Stores PIDs only |
| **Environment Setup** | Creates .env files from templates | Sets environment variables directly |
| **Graceful Shutdown** | Yes (with timeout and force kill) | No |
| **Real-time Log Tailing** | Yes (--tail option) | No |
| **Service Count** | 7 services | 7 services |
| **Startup Method** | npm run dev | node dist/*/src/index.js |
| **Best For** | Development & debugging | Docker environments |

---

## Detailed Comparison

### 1. Purpose & Use Case

#### start-all-apis.sh
- **Purpose:** Comprehensive API service management for development
- **Use Case:** Local development with full control and monitoring
- **Target User:** Developers who need detailed control and debugging
- **Environment:** Local machine with Node.js installed

#### start-services.sh
- **Purpose:** Quick startup of API services in Docker environment
- **Use Case:** Docker-based deployment or CI/CD pipelines
- **Target User:** DevOps engineers or Docker users
- **Environment:** Docker containers with compiled code

---

### 2. Prerequisites & Checks

#### start-all-apis.sh
```bash
✓ Checks Node.js installation
✓ Checks npm installation
✓ Checks PostgreSQL client
✓ Verifies API directory exists
✓ Checks node_modules exists
✓ Tests database connectivity
✓ Checks all ports are available
✓ Validates .env files exist
```

#### start-services.sh
```bash
✗ No prerequisite checks
✗ No port availability checks
��� No Node.js/npm verification
✗ Assumes Docker containers exist
✗ Assumes compiled code exists
```

---

### 3. Environment Configuration

#### start-all-apis.sh
```bash
# Creates .env files from templates if missing
if [ ! -f "$env_file" ]; then
    if [ -f "${env_file}.template" ]; then
        cp "${env_file}.template" "$env_file"
    fi
fi

# Sets environment variables per service
export PORT=$port
export NODE_ENV=${NODE_ENV:-development}
```

#### start-services.sh
```bash
# Detects Docker container IPs
POSTGRES_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' postgres)
IPFS_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' ipfs)

# Sets environment variables globally
export DB_HOST=$DB_HOST
export DB_PORT=$DB_PORT
export IPFS_HOST=$IPFS_HOST
# ... etc
```

---

### 4. Service Startup Method

#### start-all-apis.sh
```bash
# Uses npm run dev (development mode)
cd "$service_dir"
npm run dev > "$log_file" 2>&1 &
local pid=$!
```

**Advantages:**
- Uses development mode with hot reload
- Runs TypeScript compilation
- Better for development debugging

#### start-services.sh
```bash
# Uses compiled JavaScript directly
nohup node dist/${service}/src/index.js > logs/${service}.log 2>&1 &
```

**Advantages:**
- Faster startup (no compilation)
- Uses pre-compiled code
- Better for production-like environments

---

### 5. Health Checks

#### start-all-apis.sh
```bash
# Checks HTTP health endpoints
for service in "${!SERVICES[@]}"; do
    local port=${SERVICES[$service]}
    local url="http://localhost:${port}/health"
    
    if curl -s "$url" > /dev/null 2>&1; then
        local response=$(curl -s "$url")
        local db_status=$(echo "$response" | grep -o '"database":"[^"]*"')
        
        if [ "$db_status" = "connected" ]; then
            print_success "${service} is healthy (DB: connected)"
        else
            print_warning "${service} is running (DB: disconnected)"
        fi
    fi
done
```

**Features:**
- Checks if service is responding
- Verifies database connection status
- Provides detailed health information

#### start-services.sh
```bash
# No health checks
# Just starts services and assumes they work
```

---

### 6. Service Management Commands

#### start-all-apis.sh
```bash
./start-all-apis.sh              # Start all services
./start-all-apis.sh --help       # Show help
./start-all-apis.sh --check      # Check prerequisites
./start-all-apis.sh --status     # Show service status
./start-all-apis.sh --logs       # Show recent logs
./start-all-apis.sh --tail       # Tail logs in real-time
./start-all-apis.sh --stop       # Stop all services
./start-all-apis.sh --restart    # Restart all services
./start-all-apis.sh --health     # Check service health
```

#### start-services.sh
```bash
./start-services.sh              # Start all services
# That's it - no other commands
```

---

### 7. Logging

#### start-all-apis.sh
```bash
# Detailed logging with timestamps
LOG_DIR="${SCRIPT_DIR}/logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Each service gets its own log file
npm run dev > "$log_file" 2>&1 &

# Can view logs with:
./start-all-apis.sh --logs       # Show recent logs
./start-all-apis.sh --tail       # Real-time tailing
```

#### start-services.sh
```bash
# Simple logging
mkdir -p logs

# Each service gets its own log file
nohup node dist/${service}/src/index.js > logs/${service}.log 2>&1 &

# Must manually view logs
tail -f logs/<service>.log
```

---

### 8. PID Management

#### start-all-apis.sh
```bash
# Stores service name with PID
echo "$service:$pid" >> "$PID_FILE"

# Example .api-pids file:
# commercial-bank:12345
# custom-authorities:12346
# ecta:12347

# Can identify which PID belongs to which service
```

#### start-services.sh
```bash
# Stores only PID
echo $! >> /home/gu-da/cbc/.api-pids

# Example .api-pids file:
# 12345
# 12346
# 12347

# Cannot identify which PID belongs to which service
```

---

### 9. Graceful Shutdown

#### start-all-apis.sh
```bash
# Graceful shutdown with timeout
if kill -0 $pid 2>/dev/null; then
    print_info "Stopping ${service} (PID: $pid)..."
    kill $pid 2>/dev/null || true
    
    # Wait for graceful shutdown (10 seconds)
    local count=0
    while kill -0 $pid 2>/dev/null && [ $count -lt 10 ]; do
        sleep 1
        count=$((count + 1))
    done
    
    # Force kill if still running
    if kill -0 $pid 2>/dev/null; then
        kill -9 $pid 2>/dev/null || true
    fi
fi
```

#### start-services.sh
```bash
# No shutdown mechanism
# Services must be stopped manually
```

---

### 10. Error Handling

#### start-all-apis.sh
```bash
# Comprehensive error handling
set -e  # Exit on error

# Checks if process is still running after start
if ! kill -0 $pid 2>/dev/null; then
    print_error "Failed to start ${service}"
    print_info "Check log: $log_file"
    return 1
fi

# Tracks failed services
local failed_services=()
for service in "${!SERVICES[@]}"; do
    if ! start_service "$service"; then
        failed_services+=("$service")
    fi
done

# Reports failures
if [ ${#failed_services[@]} -gt 0 ]; then
    print_error "Failed to start: ${failed_services[*]}"
    return 1
fi
```

#### start-services.sh
```bash
# Basic error handling
set -e  # Exit on error

# Skips missing directories
if [ ! -d "$service_dir" ]; then
    echo "Skipping $service (directory not found)"
    continue
fi

# No verification that services started successfully
```

---

### 11. Output & User Feedback

#### start-all-apis.sh
```bash
# Color-coded output with symbols
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }

# Detailed output with headers
print_header "Checking Prerequisites"
print_header "Checking Port Availability"
print_header "Setting Up Environment"
print_header "Starting All API Services"
print_header "Checking Service Health"
```

#### start-services.sh
```bash
# Simple color-coded output
GREEN='\033[0;32m'
BLUE='\033[0;34m'

# Minimal output
echo -e "${BLUE}Starting Coffee Export Blockchain API Services${NC}"
echo "=================================================="
```

---

### 12. Docker Integration

#### start-all-apis.sh
```bash
# No Docker integration
# Assumes local PostgreSQL and IPFS
DB_HOST=localhost
IPFS_HOST=localhost
```

#### start-services.sh
```bash
# Detects Docker containers
POSTGRES_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' postgres 2>/dev/null || echo "127.0.0.1")
IPFS_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' ipfs 2>/dev/null || echo "127.0.0.1")

DB_HOST="${POSTGRES_IP:-127.0.0.1}"
IPFS_HOST="${IPFS_IP:-127.0.0.1}"
```

---

## When to Use Each Script

### Use start-all-apis.sh When:
✅ Developing locally on your machine  
✅ You need full control and debugging  
✅ You want to monitor service health  
✅ You need to stop/restart services  
✅ You want detailed logging and status  
✅ You're troubleshooting issues  
✅ You need prerequisite validation  
✅ You want real-time log tailing  

### Use start-services.sh When:
✅ Running in Docker environment  
✅ Using Docker Compose  
✅ Running in CI/CD pipeline  
✅ You have pre-compiled code  
✅ You need quick startup  
✅ You're in a production-like environment  
✅ You don't need detailed management  
✅ Services are managed by Docker  

---

## Feature Comparison Matrix

| Feature | start-all-apis.sh | start-services.sh |
|---------|:-:|:-:|
| Prerequisite checks | ✅ | ❌ |
| Port availability check | ✅ | ❌ |
| Health checks | ✅ | ❌ |
| Docker support | ❌ | ✅ |
| npm run dev | ✅ | ❌ |
| Compiled code support | ❌ | ✅ |
| Service status command | ✅ | ❌ |
| Stop services command | ✅ | ❌ |
| Restart services command | ✅ | ❌ |
| Real-time log tailing | ✅ | ❌ |
| Graceful shutdown | ✅ | ❌ |
| Service name in PID file | ✅ | ❌ |
| Environment file creation | ✅ | ❌ |
| Detailed error reporting | ✅ | ❌ |
| Color-coded output | ✅ | ✅ |
| Docker container detection | ❌ | ✅ |
| Simple & lightweight | ❌ | ✅ |

---

## Code Size Comparison

| Metric | start-all-apis.sh | start-services.sh |
|--------|-------------------|-------------------|
| Total lines | ~500 | ~100 |
| Functions | 15+ | 0 |
| Commands | 8 | 1 |
| Error checks | 20+ | 2 |
| Complexity | High | Low |

---

## Recommended Usage

### For Development
```bash
# Use start-all-apis.sh
./start-all-apis.sh --check          # Verify everything is ready
./start-all-apis.sh                  # Start all services
./start-all-apis.sh --status         # Check status
./start-all-apis.sh --tail           # Monitor logs
./start-all-apis.sh --stop           # Stop when done
```

### For Docker
```bash
# Use start-services.sh
docker-compose -f docker-compose.postgres.yml up -d
./start-services.sh                  # Start API services
tail -f logs/*.log                   # Monitor logs
```

### For Production
```bash
# Use Docker Compose or Kubernetes
docker-compose -f docker-compose.postgres.yml up -d
# Services managed by orchestration platform
```

---

## Migration Guide

### From start-services.sh to start-all-apis.sh
```bash
# If you're currently using start-services.sh and want to switch:

1. Ensure Node.js and npm are installed
2. Run: npm install (in each service directory)
3. Run: ./start-all-apis.sh --check
4. Run: ./start-all-apis.sh
```

### From start-all-apis.sh to start-services.sh
```bash
# If you're currently using start-all-apis.sh and want to switch:

1. Build compiled code: npm run build (in each service)
2. Ensure Docker containers are running
3. Run: ./start-services.sh
```

---

## Troubleshooting

### start-all-apis.sh Issues
```bash
# Check prerequisites
./start-all-apis.sh --check

# View detailed logs
./start-all-apis.sh --logs

# Check service health
./start-all-apis.sh --health

# View real-time logs
./start-all-apis.sh --tail
```

### start-services.sh Issues
```bash
# Check Docker containers
docker ps

# View service logs
tail -f logs/<service>.log

# Check Docker network
docker network inspect coffee-export-network

# Verify Docker IPs
docker inspect postgres
docker inspect ipfs
```

---

## Summary

**start-all-apis.sh** is a comprehensive development tool with full service management capabilities, while **start-services.sh** is a lightweight Docker-aware startup script. Choose based on your environment and needs:

- **Local Development** → Use **start-all-apis.sh**
- **Docker Environment** → Use **start-services.sh**
- **Production** → Use Docker Compose or Kubernetes

Both scripts serve their purpose well in their respective environments.

