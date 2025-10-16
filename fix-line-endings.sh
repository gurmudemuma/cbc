#!/bin/bash
# Fix line endings for envVar.sh
tr -d '\r' < network/scripts/envVar.sh > network/scripts/envVar_temp.sh
mv network/scripts/envVar_temp.sh network/scripts/envVar.sh
echo "Fixed line endings in envVar.sh"
