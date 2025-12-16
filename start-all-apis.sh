#!/bin/bash
cd /home/gu-da/cbc/apis/commercial-bank && npm start > /home/gu-da/cbc/logs/commercial-bank.log 2>&1 &
cd /home/gu-da/cbc/apis/national-bank && npm start > /home/gu-da/cbc/logs/national-bank.log 2>&1 &
cd /home/gu-da/cbc/apis/ecta && npm start > /home/gu-da/cbc/logs/ecta.log 2>&1 &
cd /home/gu-da/cbc/apis/ecx && npm start > /home/gu-da/cbc/logs/ecx.log 2>&1 &
cd /home/gu-da/cbc/apis/shipping-line && npm start > /home/gu-da/cbc/logs/shipping-line.log 2>&1 &
cd /home/gu-da/cbc/apis/custom-authorities && npm start > /home/gu-da/cbc/logs/custom-authorities.log 2>&1 &
echo "All APIs started. Check logs in /home/gu-da/cbc/logs/"
