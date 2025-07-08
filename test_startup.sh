#!/bin/bash
CONFIG_PATH="./config/grafana-config.simple.js" \
DATA_EXPIRY_HOURS=48 \
CONFIG_MAX_AGE=120 \
node dist/server/mcp-server.js &
SERVER_PID=$!
sleep 3
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null

