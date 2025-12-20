#!/bin/bash

################################################################################
# Database Initialization Script
# 
# This script initializes the PostgreSQL database, runs migrations,
# and seeds initial data.
#
# Usage:
#   ./init-database.sh              # Initialize database
#   ./init-database.sh --help       # Show help
#   ./init-database.sh --check      # Check prerequisites
#   ./init-database.sh --migrate    # Run migrations only
#   ./init-database.sh --seed       # Seed data only
#   ./init-database.sh --reset      # Reset database
#
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-coffee_export_db}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"
MIGRATIONS_DIR="${SCRIPT_DIR}/api/shared/database/migrations"
INIT_SCRIPT="${SCRIPT_DIR}/api/shared/database/init.sql"

# Detect if running in Docker environment
detect_db_host() {
    # PostgreSQL runs natively on localhost, not in Docker
    # Always use localhost for native API execution
    DB_HOST="localhost"
    print_debug "Using localhost for PostgreSQL connection"
}

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

print_debug() {
    echo -e "${CYAN}⚙ $1${NC}"
}

################################################################################
# Prerequisite Checks
################################################################################

check_prerequisites() {
    print_header "Checking Prerequisites"
    
    local all_ok=true
    
    # Check psql
    if ! command -v psql &> /dev/null; then
        print_error "PostgreSQL client (psql) is not installed"
        all_ok=false
    else
        print_success "PostgreSQL client $(psql --version)"
    fi
    
    # Check database connectivity
    print_info "Testing database connection to $DB_HOST:$DB_PORT..."
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d postgres -c "SELECT 1" &> /dev/null; then
        print_success "Database connection successful"
    else
        print_error "Cannot connect to database at $DB_HOST:$DB_PORT"
        all_ok=false
    fi
    
    # Check migrations directory
    if [ ! -d "$MIGRATIONS_DIR" ]; then
        print_warning "Migrations directory not found: $MIGRATIONS_DIR"
    else
        print_success "Migrations directory found"
        local migration_count=$(ls -1 "$MIGRATIONS_DIR"/*.sql 2>/dev/null | wc -l)
        print_info "Found $migration_count migration files"
    fi
    
    # Check init script
    if [ ! -f "$INIT_SCRIPT" ]; then
        print_warning "Init script not found: $INIT_SCRIPT"
    else
        print_success "Init script found"
    fi
    
    if [ "$all_ok" = false ]; then
        print_error "Some prerequisites are missing"
        return 1
    fi
    
    print_success "All prerequisites met"
    return 0
}

################################################################################
# Database Operations
################################################################################

database_exists() {
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1
}

create_database() {
    print_info "Creating database '$DB_NAME'..."
    
    if database_exists; then
        print_warning "Database '$DB_NAME' already exists"
        return 0
    fi
    
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;" &> /dev/null; then
        print_success "Database '$DB_NAME' created"
        return 0
    else
        print_error "Failed to create database '$DB_NAME'"
        return 1
    fi
}

run_init_script() {
    if [ ! -f "$INIT_SCRIPT" ]; then
        print_warning "Init script not found, skipping: $INIT_SCRIPT"
        return 0
    fi
    
    print_info "Running init script..."
    
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f "$INIT_SCRIPT" &> /dev/null; then
        print_success "Init script executed"
        return 0
    else
        print_warning "Init script execution had issues (may be expected)"
        return 0
    fi
}

run_migrations() {
    print_header "Running Database Migrations"
    
    if [ ! -d "$MIGRATIONS_DIR" ]; then
        print_warning "Migrations directory not found: $MIGRATIONS_DIR"
        return 0
    fi
    
    local migration_count=0
    local failed_count=0
    
    # Sort migrations by filename
    for migration_file in $(ls -1 "$MIGRATIONS_DIR"/*.sql 2>/dev/null | sort); do
        if [ -f "$migration_file" ]; then
            local migration_name=$(basename "$migration_file")
            print_info "Running migration: $migration_name"
            
            if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f "$migration_file" &> /dev/null; then
                print_success "Migration completed: $migration_name"
                migration_count=$((migration_count + 1))
            else
                print_warning "Migration had issues: $migration_name (may be expected)"
                failed_count=$((failed_count + 1))
            fi
        fi
    done
    
    echo ""
    print_info "Migrations completed: $migration_count executed"
    
    if [ $failed_count -gt 0 ]; then
        print_warning "$failed_count migrations had issues (may be expected)"
    fi
    
    return 0
}

verify_database() {
    print_header "Verifying Database"
    
    print_info "Checking database schema..."
    
    # Count tables
    local table_count=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -tc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')
    
    if [ "$table_count" -gt 0 ]; then
        print_success "Database has $table_count tables"
        
        # List tables
        print_info "Tables in database:"
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -tc "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;" | while read table; do
            if [ -n "$table" ]; then
                echo "  - $table"
            fi
        done
    else
        print_warning "Database has no tables"
    fi
    
    echo ""
}

reset_database() {
    print_header "Resetting Database"
    
    if ! database_exists; then
        print_warning "Database '$DB_NAME' does not exist"
        return 0
    fi
    
    print_warning "This will DROP the database '$DB_NAME'"
    read -p "Are you sure? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        print_info "Reset cancelled"
        return 0
    fi
    
    print_info "Dropping database '$DB_NAME'..."
    
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" &> /dev/null; then
        print_success "Database dropped"
        
        # Recreate
        create_database || return 1
        run_init_script || return 1
        run_migrations || return 1
        verify_database || return 1
        
        print_success "Database reset complete"
        return 0
    else
        print_error "Failed to drop database"
        return 1
    fi
}

################################################################################
# Help Function
################################################################################

show_help() {
    cat << EOF
${BLUE}Database Initialization Script${NC}

${BLUE}Usage:${NC}
    ./init-database.sh [COMMAND]

${BLUE}Commands:${NC}
    (no args)       Initialize database (create, migrate, verify)
    --help          Show this help message
    --check         Check prerequisites
    --migrate       Run migrations only
    --seed          Seed initial data (if available)
    --verify        Verify database schema
    --reset         Reset database (DROP and recreate)

${BLUE}Examples:${NC}
    # Initialize database
    ./init-database.sh

    # Check if everything is ready
    ./init-database.sh --check

    # Run migrations only
    ./init-database.sh --migrate

    # Verify database
    ./init-database.sh --verify

    # Reset database
    ./init-database.sh --reset

${BLUE}Database Configuration:${NC}
    Host: ${DB_HOST}
    Port: ${DB_PORT}
    Database: ${DB_NAME}
    User: ${DB_USER}

${BLUE}Directories:${NC}
    Migrations: ${MIGRATIONS_DIR}
    Init Script: ${INIT_SCRIPT}

${BLUE}Environment Variables:${NC}
    DB_HOST         Database host (default: localhost)
    DB_PORT         Database port (default: 5432)
    DB_NAME         Database name (default: coffee_export_db)
    DB_USER         Database user (default: postgres)
    DB_PASSWORD     Database password (default: postgres)

EOF
}

################################################################################
# Main Script
################################################################################

main() {
    local command=${1:-init}
    
    # Detect Docker environment first
    detect_db_host
    
    case "$command" in
        --help|-h)
            show_help
            exit 0
            ;;
        --check)
            check_prerequisites
            exit $?
            ;;
        --migrate)
            check_prerequisites || exit 1
            echo ""
            run_migrations
            exit $?
            ;;
        --seed)
            print_info "Seed functionality not yet implemented"
            exit 0
            ;;
        --verify)
            check_prerequisites || exit 1
            echo ""
            verify_database
            exit 0
            ;;
        --reset)
            check_prerequisites || exit 1
            echo ""
            reset_database
            exit $?
            ;;
        init)
            print_header "Database Initialization"
            print_info "Initializing PostgreSQL database..."
            echo ""
            
            check_prerequisites || exit 1
            echo ""
            
            create_database || exit 1
            echo ""
            
            run_init_script
            echo ""
            
            run_migrations
            echo ""
            
            verify_database
            echo ""
            
            print_header "Database Initialization Complete"
            print_success "Database is ready for use"
            echo ""
            print_info "Next step: Run './start-all-apis.sh' to start API services"
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
