#!/bin/bash
# Script to read CouchDB password from Docker secret
# This is used by Fabric peers to connect to CouchDB

if [ -f /run/secrets/couchdb_password ]; then
    cat /run/secrets/couchdb_password
else
    echo "adminpw"  # Fallback for development
fi
