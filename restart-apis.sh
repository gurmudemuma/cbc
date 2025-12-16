#!/bin/bash
cd /home/gu-da/cbc/apis/commercial-bank && PORT=3001 node src/index.js > /tmp/api-3001.log 2>&1 &
cd /home/gu-da/cbc/apis/national-bank && PORT=3002 node src/index.js > /tmp/api-3002.log 2>&1 &
cd /home/gu-da/cbc/apis/shipping-line && PORT=3003 node src/index.js > /tmp/api-3003.log 2>&1 &
cd /home/gu-da/cbc/apis/ecx && PORT=3004 node src/index.js > /tmp/api-3004.log 2>&1 &
cd /home/gu-da/cbc/apis/ecta && PORT=3005 node src/index.js > /tmp/api-3005.log 2>&1 &
cd /home/gu-da/cbc/apis/custom-authorities && PORT=3006 node src/index.js > /tmp/api-3006.log 2>&1 &
sleep 3
echo "APIs started"
