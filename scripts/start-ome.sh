#!/bin/bash

# OvenMediaEngine Startup Script
# This script starts OvenMediaEngine with proper configuration

OME_DIR="/home/ubuntu/dashboardome/OvenMediaEngine"
OME_BIN="$OME_DIR/src/bin/RELEASE/OvenMediaEngine"
OME_CONF="$OME_DIR/conf"
OME_LOGS="$OME_DIR/logs"

# Create logs directory if it doesn't exist
mkdir -p "$OME_LOGS"

# Set environment variables
export OME_HOST_IP=192.168.1.102
export LD_LIBRARY_PATH="$OME_DIR/src/bin/RELEASE:$LD_LIBRARY_PATH"

# Check if OvenMediaEngine binary exists
if [ ! -f "$OME_BIN" ]; then
    echo "Error: OvenMediaEngine binary not found at $OME_BIN"
    exit 1
fi

# Check if configuration directory exists
if [ ! -d "$OME_CONF" ]; then
    echo "Error: Configuration directory not found at $OME_CONF"
    exit 1
fi

echo "Starting OvenMediaEngine..."
echo "Binary: $OME_BIN"
echo "Config: $OME_CONF"
echo "Host IP: $OME_HOST_IP"
echo "Logs: $OME_LOGS"

# Start OvenMediaEngine
cd "$OME_DIR"
exec "$OME_BIN" -c "$OME_CONF"
