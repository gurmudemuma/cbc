#!/bin/bash

# Cleanup script to remove empty placeholder files
# Generated as part of codebase review fixes

echo "========================================="
echo "Cleaning up empty files and placeholders"
echo "========================================="

# List of empty files to remove (confirmed zero-byte files from root)
EMPTY_FILES=(
    "config.json"
    "Received"
    "Downloading"
    "Chaincode"
    "Loading"
    "Writing"
    "Downloading:"
    "There"
    "modified_config.json"
    "2.5.4"
    "orderer"
    "Done."
    "CustomAuthoritiesMSPconfig.json"
    "Retrieving"
    "update.json"
    "Generating"
    "Loaded"
    "Endorser"
    "Creating"
    "update_in_envelope.json"
    "Orderer.EtcdRaft.Options"
    "Successfully"
)

count=0
for file in "${EMPTY_FILES[@]}"; do
    if [ -f "$file" ] && [ ! -s "$file" ]; then
        echo "Removing empty file: $file"
        rm -f "$file"
        ((count++))
    fi
done

echo ""
echo "Removed $count empty files"
echo "========================================="
