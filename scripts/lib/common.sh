#!/bin/bash

# Common functions for CBC scripts

# Check if port is in use
is_port_in_use() {
    local PORT=$1
    lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1
}

# Check port and print status
check_port() {
    local PORT=$1
    local SERVICE=$2
    if is_port_in_use $PORT; then
        echo "⚠️  Warning: Port $PORT ($SERVICE) is already in use"
        return 1
    else
        echo "✅ Port $PORT ($SERVICE) is available"
        return 0
    fi
}

# Kill process on port
kill_port() {
    local PORT=$1
    local PID=$(lsof -t -i:$PORT)
    if [ ! -z "$PID" ]; then
        echo "Killing process $PID on port $PORT"
        kill -9 $PID 2>/dev/null || true
    fi
}

# Other common functions can be added here
# e.g. print_header, run_test, etc.