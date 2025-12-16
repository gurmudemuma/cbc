#!/bin/bash

# ============================================================================
# Docker Management Script
# Manage all Docker services for Coffee Export Blockchain
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_COMPOSE_FILE="$PROJECT_DIR/docker-compose.yml"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✓ $1${NC}"
}

error() {
    echo -e "${RED}✗ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Display menu
show_menu() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}Docker Management Menu${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo "1. Start all services"
    echo "2. Stop all services"
    echo "3. Restart all services"
    echo "4. View service status"
    echo "5. View logs (all services)"
    echo "6. View logs (specific service)"
    echo "7. Access service shell"
    echo "8. Access database"
    echo "9. Backup database"
    echo "10. Restore database"
    echo "11. Clean up (remove stopped containers)"
    echo "12. Full cleanup (remove all data)"
    echo "13. Rebuild images"
    echo "14. Health check"
    echo "15. Exit"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

# Start services
start_services() {
    log "Starting all services..."
    cd "$PROJECT_DIR"
    docker-compose up -d
    success "Services started"
}

# Stop services
stop_services() {
    log "Stopping all services..."
    cd "$PROJECT_DIR"
    docker-compose down
    success "Services stopped"
}

# Restart services
restart_services() {
    log "Restarting all services..."
    cd "$PROJECT_DIR"
    docker-compose restart
    success "Services restarted"
}

# View service status
view_status() {
    log "Service Status:"
    cd "$PROJECT_DIR"
    docker-compose ps
}

# View logs
view_logs() {
    log "Viewing logs (press Ctrl+C to exit)..."
    cd "$PROJECT_DIR"
    docker-compose logs -f --tail=100
}

# View specific service logs
view_service_logs() {
    echo ""
    echo "Available services:"
    echo "1. postgres"
    echo "2. ipfs"
    echo "3. orderer.coffee-export.com"
    echo "4. peer0.commercialbank.coffee-export.com"
    echo "5. peer0.nationalbank.coffee-export.com"
    echo "6. peer0.ecta.coffee-export.com"
    echo "7. peer0.shippingline.coffee-export.com"
    echo "8. peer0.custom-authorities.coffee-export.com"
    echo "9. commercialbank-api"
    echo "10. national-bank-api"
    echo "11. ecta-api"
    echo "12. shipping-line-api"
    echo "13. custom-authorities-api"
    echo "14. frontend"
    echo "15. redis"
    echo ""
    read -p "Select service (1-15): " service_num
    
    case $service_num in
        1) service="postgres" ;;
        2) service="ipfs" ;;
        3) service="orderer.coffee-export.com" ;;
        4) service="peer0.commercialbank.coffee-export.com" ;;
        5) service="peer0.nationalbank.coffee-export.com" ;;
        6) service="peer0.ecta.coffee-export.com" ;;
        7) service="peer0.shippingline.coffee-export.com" ;;
        8) service="peer0.custom-authorities.coffee-export.com" ;;
        9) service="commercialbank-api" ;;
        10) service="national-bank-api" ;;
        11) service="ecta-api" ;;
        12) service="shipping-line-api" ;;
        13) service="custom-authorities-api" ;;
        14) service="frontend" ;;
        15) service="redis" ;;
        *) error "Invalid selection"; return ;;
    esac
    
    log "Viewing logs for $service (press Ctrl+C to exit)..."
    cd "$PROJECT_DIR"
    docker-compose logs -f --tail=100 "$service"
}

# Access service shell
access_shell() {
    echo ""
    echo "Available services:"
    echo "1. postgres"
    echo "2. ipfs"
    echo "3. commercialbank-api"
    echo "4. national-bank-api"
    echo "5. ecta-api"
    echo "6. shipping-line-api"
    echo "7. custom-authorities-api"
    echo "8. cli"
    echo ""
    read -p "Select service (1-8): " service_num
    
    case $service_num in
        1) service="postgres"; shell="/bin/bash" ;;
        2) service="ipfs"; shell="/bin/sh" ;;
        3) service="commercialbank-api"; shell="/bin/sh" ;;
        4) service="national-bank-api"; shell="/bin/sh" ;;
        5) service="ecta-api"; shell="/bin/sh" ;;
        6) service="shipping-line-api"; shell="/bin/sh" ;;
        7) service="custom-authorities-api"; shell="/bin/sh" ;;
        8) service="cli"; shell="/bin/bash" ;;
        *) error "Invalid selection"; return ;;
    esac
    
    log "Accessing shell for $service..."
    cd "$PROJECT_DIR"
    docker-compose exec "$service" "$shell"
}

# Access database
access_database() {
    log "Accessing PostgreSQL database..."
    cd "$PROJECT_DIR"
    docker-compose exec postgres psql -U postgres -d coffee_export_db
}

# Backup database
backup_database() {
    read -p "Enter backup filename (default: backup_$(date +%Y%m%d_%H%M%S).sql): " backup_file
    backup_file="${backup_file:-backup_$(date +%Y%m%d_%H%M%S).sql}"
    
    log "Backing up database to $backup_file..."
    cd "$PROJECT_DIR"
    docker-compose exec -T postgres pg_dump -U postgres coffee_export_db > "$backup_file"
    success "Database backed up to $backup_file"
}

# Restore database
restore_database() {
    read -p "Enter backup filename to restore: " backup_file
    
    if [ ! -f "$backup_file" ]; then
        error "File not found: $backup_file"
        return
    fi
    
    log "Restoring database from $backup_file..."
    cd "$PROJECT_DIR"
    docker-compose exec -T postgres psql -U postgres coffee_export_db < "$backup_file"
    success "Database restored from $backup_file"
}

# Clean up
cleanup() {
    log "Cleaning up stopped containers..."
    cd "$PROJECT_DIR"
    docker-compose rm -f
    success "Cleanup complete"
}

# Full cleanup
full_cleanup() {
    warning "This will remove all containers, images, and volumes!"
    read -p "Are you sure? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        log "Cleanup cancelled"
        return
    fi
    
    log "Performing full cleanup..."
    cd "$PROJECT_DIR"
    docker-compose down -v
    docker system prune -a --volumes -f
    success "Full cleanup complete"
}

# Rebuild images
rebuild_images() {
    log "Rebuilding Docker images..."
    cd "$PROJECT_DIR"
    docker-compose build --no-cache
    success "Images rebuilt"
}

# Health check
health_check() {
    log "Performing health check..."
    echo ""
    
    # Check Docker
    if docker ps &> /dev/null; then
        success "Docker daemon is running"
    else
        error "Docker daemon is not running"
    fi
    
    # Check services
    cd "$PROJECT_DIR"
    
    echo ""
    log "Service Status:"
    docker-compose ps
    
    echo ""
    log "Testing API endpoints:"
    for port in 3001 3002 3003 3004 3005; do
        if curl -s http://localhost:$port/health &> /dev/null; then
            success "API on port $port is responding"
        else
            error "API on port $port is not responding"
        fi
    done
    
    echo ""
    log "Testing database:"
    if docker-compose exec -T postgres psql -U postgres -d coffee_export_db -c "SELECT 1" &> /dev/null; then
        success "Database is responding"
    else
        error "Database is not responding"
    fi
    
    echo ""
    log "Testing IPFS:"
    if docker-compose exec -T ipfs ipfs id &> /dev/null; then
        success "IPFS is responding"
    else
        error "IPFS is not responding"
    fi
}

# Main loop
main() {
    while true; do
        show_menu
        read -p "Select option (1-15): " choice
        
        case $choice in
            1) start_services ;;
            2) stop_services ;;
            3) restart_services ;;
            4) view_status ;;
            5) view_logs ;;
            6) view_service_logs ;;
            7) access_shell ;;
            8) access_database ;;
            9) backup_database ;;
            10) restore_database ;;
            11) cleanup ;;
            12) full_cleanup ;;
            13) rebuild_images ;;
            14) health_check ;;
            15) log "Exiting..."; exit 0 ;;
            *) error "Invalid option" ;;
        esac
    done
}

# Run main function
main "$@"
