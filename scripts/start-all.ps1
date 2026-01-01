# Coffee Export Blockchain - Complete System Startup (PowerShell)
# This script starts the entire CBC system on Windows

param(
    [Parameter(Position=0)]
    [string]$Command = "start"
)

# Colors
$Green = "Green"
$Red = "Red"
$Yellow = "Yellow"
$Cyan = "Cyan"

function Print-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
}

function Print-Success {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Print-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Print-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Print-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Check-Prerequisites {
    Print-Header "Checking Prerequisites"
    
    # Check Docker
    if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
        Print-Error "Docker is not installed"
        Write-Host "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop"
        return $false
    }
    Print-Success "Docker is installed"
    
    # Check if Docker is running
    try {
        docker ps | Out-Null
        Print-Success "Docker daemon is running"
    } catch {
        Print-Error "Docker daemon is not running"
        Write-Host "Please start Docker Desktop and try again"
        return $false
    }
    
    # Check Node.js
    if (!(Get-Command node -ErrorAction SilentlyContinue)) {
        Print-Error "Node.js is not installed"
        return $false
    }
    Print-Success "Node.js is installed"
    
    # Check npm
    if (!(Get-Command npm -ErrorAction SilentlyContinue)) {
        Print-Error "npm is not installed"
        return $false
    }
    Print-Success "npm is installed"
    
    Print-Success "All prerequisites met"
    Write-Host ""
    return $true
}

function Start-Infrastructure {
    Print-Header "Step 1/3: Starting Infrastructure Services"
    Print-Info "Starting PostgreSQL, Redis, and IPFS via Docker..."
    Write-Host ""
    
    docker-compose -f docker-compose.postgres.yml up -d
    if ($LASTEXITCODE -ne 0) {
        Print-Error "Failed to start infrastructure services"
        return $false
    }
    
    Print-Success "Infrastructure services started"
    Write-Host ""
    Print-Info "Waiting 45 seconds for infrastructure to be ready..."
    Start-Sleep -Seconds 45
    Write-Host ""
    
    # Verify infrastructure health
    Print-Info "Checking infrastructure health..."
    
    try {
        docker exec postgres pg_isready -U postgres | Out-Null
        Print-Success "PostgreSQL is ready"
    } catch {
        Print-Warning "PostgreSQL may not be fully ready yet"
    }
    
    try {
        docker exec redis redis-cli ping | Out-Null
        Print-Success "Redis is ready"
    } catch {
        Print-Warning "Redis may not be fully ready yet"
    }
    
    Write-Host ""
    return $true
}

function Start-APIServices {
    Print-Header "Step 2/3: Starting API Services"
    Print-Info "Starting all 7 API microservices via Docker..."
    Write-Host ""
    
    docker-compose -f docker-compose.apis.yml up -d
    if ($LASTEXITCODE -ne 0) {
        Print-Error "Failed to start API services"
        return $false
    }
    
    Print-Success "API services started"
    Write-Host ""
    Print-Info "Waiting 30 seconds for APIs to be ready..."
    Start-Sleep -Seconds 30
    Write-Host ""
    
    return $true
}

function Start-Frontend {
    Print-Header "Step 3/3: Starting Frontend"
    
    # Check if frontend is already running
    $port5173 = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
    if ($port5173) {
        Print-Success "Frontend is already running on port 5173"
        Write-Host ""
        return $true
    }
    
    Print-Info "Frontend will start in your existing terminal (npm run dev)"
    Print-Info "If not running, open a new terminal and run: cd frontend && npm run dev"
    Write-Host ""
    
    return $true
}

function Show-Summary {
    Print-Header "System Startup Complete!"
    Write-Host ""
    Print-Success "All services are running!"
    Write-Host ""
    
    Write-Host "Access Points:" -ForegroundColor Cyan
    Write-Host "  Frontend:              http://localhost:5173"
    Write-Host ""
    Write-Host "  API Services:" -ForegroundColor Cyan
    Write-Host "  Commercial Bank:       http://localhost:3001"
    Write-Host "  Custom Authorities:    http://localhost:3002"
    Write-Host "  ECTA:                  http://localhost:3003"
    Write-Host "  Exporter Portal:       http://localhost:3004"
    Write-Host "  National Bank:         http://localhost:3005"
    Write-Host "  ECX:                   http://localhost:3006"
    Write-Host "  Shipping Line:         http://localhost:3007"
    Write-Host ""
    Write-Host "  Infrastructure:" -ForegroundColor Cyan
    Write-Host "  PostgreSQL:            localhost:5432"
    Write-Host "  Redis:                 localhost:6379"
    Write-Host "  IPFS:                  localhost:5001"
    Write-Host ""
    
    Write-Host "Useful Commands:" -ForegroundColor Cyan
    Write-Host "  View API logs:         docker-compose -f docker-compose.apis.yml logs -f"
    Write-Host "  View infrastructure:   docker-compose -f docker-compose.postgres.yml logs -f"
    Write-Host "  Stop everything:       .\start-all.ps1 stop"
    Write-Host "  Check status:          docker ps"
    Write-Host ""
    
    Print-Success "System is ready for use!"
    Write-Host ""
}

function Stop-AllServices {
    Print-Header "Stopping All Services"
    Write-Host ""
    
    Print-Info "Stopping API services..."
    docker-compose -f docker-compose.apis.yml down
    Print-Success "API services stopped"
    
    Print-Info "Stopping infrastructure..."
    docker-compose -f docker-compose.postgres.yml down
    Print-Success "Infrastructure stopped"
    
    Write-Host ""
    Print-Success "All services stopped"
    Write-Host ""
}

function Show-Help {
    Write-Host ""
    Write-Host "Coffee Export Blockchain - Complete System Startup" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage:"
    Write-Host "    .\start-all.ps1              Start entire system"
    Write-Host "    .\start-all.ps1 help         Show this help"
    Write-Host "    .\start-all.ps1 stop         Stop all services"
    Write-Host ""
    Write-Host "What it does:"
    Write-Host "    1. Starts infrastructure (PostgreSQL, Redis, IPFS)"
    Write-Host "    2. Starts all 7 API microservices"
    Write-Host "    3. Checks frontend status"
    Write-Host ""
    Write-Host "Prerequisites:"
    Write-Host "    - Docker Desktop (running)"
    Write-Host "    - Node.js 18+"
    Write-Host "    - npm"
    Write-Host ""
}

# Main script
switch ($Command.ToLower()) {
    "help" {
        Show-Help
        Read-Host "Press Enter to exit..."
        exit 0
    }
    "stop" {
        Stop-AllServices
        Read-Host "Press Enter to exit..."
        exit 0
    }
    "start" {
        Print-Header "Coffee Export Blockchain - System Startup"
        Print-Info "Starting entire system..."
        Write-Host ""
        
        if (!(Check-Prerequisites)) {
            Read-Host "Press Enter to exit..."
            exit 1
        }
        
        if (!(Start-Infrastructure)) {
            Read-Host "Press Enter to exit..."
            exit 1
        }
        
        if (!(Start-APIServices)) {
            Read-Host "Press Enter to exit..."
            exit 1
        }
        
        if (!(Start-Frontend)) {
            Read-Host "Press Enter to exit..."
            exit 1
        }
        
        Show-Summary
        Read-Host "Press Enter to exit..."
        exit 0
    }
    default {
        Print-Error "Unknown command: $Command"
        Show-Help
        Read-Host "Press Enter to exit..."
        exit 1
    }
}
