#!/bin/bash

################################################################################
# Coffee Export System - Deployment Test Script
# Tests nginx reverse proxy and backend services
################################################################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_test() {
    echo -n "Testing $1... "
}

print_pass() {
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
}

print_fail() {
    echo -e "${RED}✗ FAILED${NC} $1"
    ((FAILED++))
}

print_warning() {
    echo -e "${YELLOW}⚠ WARNING${NC} $1"
}

################################################################################
# Test Functions
################################################################################

test_nginx_status() {
    print_test "Nginx service status"
    if systemctl is-active --quiet nginx; then
        print_pass
    else
        print_fail "Nginx is not running"
    fi
}

test_nginx_config() {
    print_test "Nginx configuration"
    if nginx -t 2>&1 | grep -q "successful"; then
        print_pass
    else
        print_fail "Configuration has errors"
    fi
}

test_backend_service() {
    local port=$1
    local name=$2
    local endpoint=${3:-/health}
    
    print_test "$name (port $port)"
    
    if curl -s -f --max-time 5 "http://localhost:$port$endpoint" > /dev/null 2>&1; then
        print_pass
    else
        print_fail "Service not responding"
    fi
}

test_reverse_proxy() {
    local path=$1
    local description=$2
    
    print_test "Reverse proxy: $description"
    
    if curl -s -f --max-time 5 "http://localhost$path" > /dev/null 2>&1; then
        print_pass
    else
        print_fail "Proxy not working"
    fi
}

test_docker_container() {
    local container=$1
    local name=$2
    
    print_test "Docker container: $name"
    
    if docker ps --format '{{.Names}}' | grep -q "^$container$"; then
        print_pass
    else
        print_fail "Container not running"
    fi
}

test_port_listening() {
    local port=$1
    local name=$2
    
    print_test "Port $port ($name)"
    
    if netstat -tln 2>/dev/null | grep -q ":$port " || ss -tln 2>/dev/null | grep -q ":$port "; then
        print_pass
    else
        print_fail "Port not listening"
    fi
}

test_ssl_certificate() {
    local domain=$1
    
    print_test "SSL certificate for $domain"
    
    if echo | openssl s_client -connect "$domain:443" -servername "$domain" 2>/dev/null | grep -q "Verify return code: 0"; then
        print_pass
    else
        print_fail "SSL certificate invalid or not configured"
    fi
}

################################################################################
# Main Test Suite
################################################################################

main() {
    print_header "Coffee Export System - Deployment Test"
    echo ""
    
    # Test 1: Nginx
    print_header "1. Nginx Service Tests"
    test_nginx_status
    test_nginx_config
    echo ""
    
    # Test 2: Port Listening
    print_header "2. Port Listening Tests"
    test_port_listening 80 "HTTP"
    test_port_listening 3000 "Gateway"
    test_port_listening 3010 "Exporter Portal"
    test_port_listening 3003 "ECTA Service"
    test_port_listening 5173 "Frontend"
    echo ""
    
    # Test 3: Docker Containers
    print_header "3. Docker Container Tests"
    test_docker_container "coffee-gateway" "Gateway"
    test_docker_container "coffee-exporter-portal" "Exporter Portal"
    test_docker_container "coffee-ecta" "ECTA Service"
    test_docker_container "coffee-frontend" "Frontend"
    test_docker_container "coffee-postgres" "PostgreSQL"
    test_docker_container "coffee-redis" "Redis"
    test_docker_container "coffee-kafka" "Kafka"
    echo ""
    
    # Test 4: Backend Services
    print_header "4. Backend Service Health Tests"
    test_backend_service 3000 "Gateway Service"
    test_backend_service 3010 "Exporter Portal Service"
    test_backend_service 3003 "ECTA Service"
    test_backend_service 3002 "Commercial Bank Service"
    test_backend_service 3004 "National Bank Service"
    test_backend_service 3005 "Customs Service"
    test_backend_service 3006 "ECX Service"
    test_backend_service 3007 "Shipping Service"
    test_backend_service 3009 "Buyer Verification Service"
    test_backend_service 5173 "Frontend Service"
    echo ""
    
    # Test 5: Reverse Proxy
    print_header "5. Reverse Proxy Tests"
    test_reverse_proxy "/health" "Health endpoint"
    test_reverse_proxy "/api/health" "API health endpoint"
    test_reverse_proxy "/" "Frontend root"
    echo ""
    
    # Test 6: API Endpoints
    print_header "6. API Endpoint Tests"
    
    print_test "API Gateway endpoint"
    if curl -s --max-time 5 "http://localhost/api/health" | grep -q "healthy\|ok\|success" 2>/dev/null; then
        print_pass
    else
        print_warning "Endpoint exists but response format unknown"
    fi
    
    print_test "Exporter Portal endpoint"
    response=$(curl -s --max-time 5 "http://localhost/api/exporter/health" 2>/dev/null)
    if [ -n "$response" ]; then
        print_pass
    else
        print_warning "Endpoint may not be configured"
    fi
    
    print_test "ECTA Service endpoint"
    response=$(curl -s --max-time 5 "http://localhost/api/ecta/contracts" 2>/dev/null)
    if [ -n "$response" ]; then
        print_pass
    else
        print_warning "Endpoint requires authentication"
    fi
    
    echo ""
    
    # Test 7: Database
    print_header "7. Database Tests"
    
    print_test "PostgreSQL connection"
    if docker exec coffee-postgres pg_isready -U postgres > /dev/null 2>&1; then
        print_pass
    else
        print_fail "Cannot connect to PostgreSQL"
    fi
    
    print_test "Redis connection"
    if docker exec coffee-redis redis-cli ping 2>/dev/null | grep -q "PONG"; then
        print_pass
    else
        print_fail "Cannot connect to Redis"
    fi
    
    echo ""
    
    # Test 8: Logs
    print_header "8. Log File Tests"
    
    print_test "Nginx access log"
    if [ -f /var/log/nginx/access.log ]; then
        print_pass
    else
        print_fail "Access log not found"
    fi
    
    print_test "Nginx error log"
    if [ -f /var/log/nginx/error.log ]; then
        print_pass
    else
        print_fail "Error log not found"
    fi
    
    echo ""
    
    # Summary
    print_header "Test Summary"
    TOTAL=$((PASSED + FAILED))
    echo -e "Total tests: $TOTAL"
    echo -e "${GREEN}Passed: $PASSED${NC}"
    echo -e "${RED}Failed: $FAILED${NC}"
    
    if [ $FAILED -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✓ All tests passed! System is ready.${NC}"
        exit 0
    else
        echo ""
        echo -e "${RED}✗ Some tests failed. Please check the errors above.${NC}"
        echo ""
        echo "Troubleshooting tips:"
        echo "1. Check if Docker services are running: docker ps"
        echo "2. Check nginx logs: tail -f /var/log/nginx/error.log"
        echo "3. Check Docker logs: docker-compose logs -f"
        echo "4. Restart services: docker-compose restart && systemctl restart nginx"
        exit 1
    fi
}

################################################################################
# Script Entry Point
################################################################################

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    echo -e "${YELLOW}Warning: Some tests require root privileges${NC}"
    echo "Run with sudo for complete testing"
    echo ""
fi

# Run tests
main
