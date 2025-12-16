#!/bin/bash
# Wrapper script - calls the actual start script
exec "$(dirname "$0")/scripts/start.sh" "$@"
