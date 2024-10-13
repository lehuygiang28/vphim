#!/bin/sh

# Load environment variables from .env file if it exists
if [ -f .env ]; then
  # Use `set -o allexport` and `set +o allexport` to ensure spaces are handled properly
  set -o allexport
  source .env
  set +o allexport
fi

# Check if PM2_ID and PM2_SEC are set
if [ -n "$PM2_ID" ] && [ -n "$PM2_SEC" ]; then
  pm2 link "$PM2_ID" "$PM2_SEC"
else
  echo "PM2_ID and PM2_SEC must be set to link to PM2.io"
fi

sysctl -w net.core.rmem_default=26214400
sysctl -w net.core.wmem_default=26214400
sysctl -w net.core.rmem_max=26214400
sysctl -w net.core.wmem_max=26214400

# Start PM2 with the ecosystem file in runtime mode (suitable for Docker)
exec pm2-runtime start ecosystem.config.js
