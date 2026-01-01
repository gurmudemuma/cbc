#!/bin/bash

################################################################################
# Fix Environment Files Script
# 
# This script fixes all .env files for API services by resetting them from
# templates and applying correct Docker-aware configuration.
#
# Usage:
#   ./fix-env-files.sh              # Fix all .env files
#   ./fix-env-files.sh --help       # Show help
#
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Services
declare -a SERVICES=(
    "commercial-bank"
    "custom-authorities"
    "ecta"
    "exporter-portal"
    "national-bank"
    "ecx"
    "shipping-line"
)

################################################################################
# Helper Functions
################################################################################

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

################################################################################
# Fix Environment Files
################################################################################

fix_env_file() {
    local service=$1
    local service_dir="${SCRIPT_DIR}/api/${service}"
    local env_file="${service_dir}/.env"
    local template_file="${service_dir}/.env.template"
    
    print_info "Fixing .env for ${service}..."
    
    if [ ! -f "$template_file" ]; then
        print_warning "Template not found for ${service}: $template_file"
        return 1
    fi
    
    # Backup existing .env if it exists
    if [ -f "$env_file" ]; then
        local backup_file="${env_file}.backup.$(date +%s)"
        cp "$env_file" "$backup_file"
        print_info "Backed up existing .env to: $backup_file"
    fi
    
    # Copy template to .env
    cp "$template_file" "$env_file"
    
    # Fix database configuration for localhost (non-container)
    sed -i 's/^DB_HOST=.*/DB_HOST=localhost/' "$env_file"
    sed -i 's/^DB_PORT=.*/DB_PORT=5432/' "$env_file"
    sed -i 's/^DB_PASSWORD=.*/DB_PASSWORD=postgres/' "$env_file"
    
    # Fix Redis configuration for localhost (non-container)
    sed -i 's/^REDIS_HOST=.*/REDIS_HOST=localhost/' "$env_file"
    sed -i 's/^REDIS_PORT=.*/REDIS_PORT=6379/' "$env_file"
    
    # Fix IPFS configuration for localhost (non-container)
    sed -i 's/^IPFS_HOST=.*/IPFS_HOST=localhost/' "$env_file"
    sed -i 's/^IPFS_PORT=.*/IPFS_PORT=5001/' "$env_file"
    sed -i 's/^IPFS_GATEWAY_PORT=.*/IPFS_GATEWAY_PORT=8080/' "$env_file"
    
    # Fix EMAIL configuration
    sed -i 's/^EMAIL_PORT=.*/EMAIL_PORT=587/' "$env_file"
    sed -i 's/^SMTP_PORT=.*/SMTP_PORT=587/' "$env_file"
    
    # Fix NODE_ENV to development
    sed -i 's/^NODE_ENV=.*/NODE_ENV=development/' "$env_file"
    
    # Fix CORS for local development
<<<<<<< HEAD
    sed -i 's/^CORS_ORIGIN=.*/CORS_ORIGIN=http:\\/\\/localhost:5173/' "$env_file"
=======
    sed -i 's/^CORS_ORIGIN=.*/CORS_ORIGIN=http:\/\/localhost:5173,http:\/\/localhost:3000/' "$env_file"
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    
    print_success "Fixed .env for ${service}"
    return 0
}

fix_all_env_files() {
    print_header "Fixing All Environment Files"
    
    local failed=0
    
    for service in "${SERVICES[@]}"; do
        if ! fix_env_file "$service"; then
            failed=$((failed + 1))
        fi
    done
    
    echo ""
    
    if [ $failed -eq 0 ]; then
        print_success "All .env files fixed successfully"
        return 0
    else
        print_error "$failed .env files failed to fix"
        return 1
    fi
}

verify_env_files() {
    print_header "Verifying Environment Files"
    
    for service in "${SERVICES[@]}"; do
        local env_file="${SCRIPT_DIR}/api/${service}/.env"
        
        if [ ! -f "$env_file" ]; then
            print_error "Missing .env for ${service}"
            continue
        fi
        
        # Check critical settings
        local db_host=$(grep "^DB_HOST=" "$env_file" | cut -d'=' -f2)
        local db_port=$(grep "^DB_PORT=" "$env_file" | cut -d'=' -f2)
        local redis_host=$(grep "^REDIS_HOST=" "$env_file" | cut -d'=' -f2)
        local redis_port=$(grep "^REDIS_PORT=" "$env_file" | cut -d'=' -f2)
        
        if [ "$db_host" = "localhost" ] && [ "$db_port" = "5432" ] && [ "$redis_host" = "localhost" ] && [ "$redis_port" = "6379" ]; then
            print_success "${service}: DB_HOST=$db_host, DB_PORT=$db_port, REDIS_HOST=$redis_host, REDIS_PORT=$redis_port"
        else
            print_warning "${service}: DB_HOST=$db_host, DB_PORT=$db_port, REDIS_HOST=$redis_host, REDIS_PORT=$redis_port"
        fi
    done
    
    echo ""
}

show_help() {
    cat << EOF
${BLUE}Fix Environment Files Script${NC}

${BLUE}Usage:${NC}
    ./fix-env-files.sh [COMMAND]

${BLUE}Commands:${NC}
    (no args)       Fix all .env files
    --help          Show this help message
    --verify        Verify .env files

${BLUE}What it does:${NC}
    1. Backs up existing .env files
    2. Copies .env.template to .env
    3. Fixes database configuration for localhost (non-container):
       - DB_HOST=localhost
       - DB_PORT=5432
       - DB_PASSWORD=postgres
    4. Fixes Redis configuration for localhost (non-container):
       - REDIS_HOST=localhost
       - REDIS_PORT=6379
    5. Fixes IPFS configuration for localhost (non-container):
       - IPFS_HOST=localhost
       - IPFS_PORT=5001
    6. Fixes email/SMTP ports
    7. Sets NODE_ENV=development
    8. Configures CORS for localhost

${BLUE}Services:${NC}
    - commercial-bank
    - custom-authorities
    - ecta
    - exporter-portal
    - national-bank
    - ecx
    - shipping-line

${BLUE}Examples:${NC}
    # Fix all .env files
    ./fix-env-files.sh

    # Verify .env files
    ./fix-env-files.sh --verify

${BLUE}Backups:${NC}
    Original .env files are backed up as:
    .env.backup.<timestamp>

EOF
}

################################################################################
# Main Script
################################################################################

main() {
    local command=${1:-fix}
    
    case "$command" in
        --help|-h)
            show_help
            exit 0
            ;;
        --verify)
            verify_env_files
            exit 0
            ;;
        fix)
            fix_all_env_files
            echo ""
            verify_env_files
            echo ""
            print_info "Next step: Run './start-all.sh' to start the system"
            echo ""
            ;;
        *)
            print_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
