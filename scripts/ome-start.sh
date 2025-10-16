#!/bin/bash

set -euo pipefail

BASE_DIR="/home/ubuntu/dashboardome"
BIN_PATH="$BASE_DIR/OvenMediaEngine/src/bin/RELEASE/OvenMediaEngine"
CONF_DIR="$BASE_DIR/OvenMediaEngine/conf"

# Optional: set host ip if needed by config
export OME_HOST_IP=${OME_HOST_IP:-"192.168.1.102"}

if [ ! -x "$BIN_PATH" ]; then
  echo "OvenMediaEngine binary not found or not executable: $BIN_PATH" >&2
  exit 1
fi

exec "$BIN_PATH" -c "$CONF_DIR"


