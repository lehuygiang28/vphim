#!/bin/sh

# Check if PM2_ID and PM2_SEC are set
if [ -n "$PM2_ID" ] && [ -n "$PM2_SEC" ]; then
  pm2 link "$PM2_ID" "$PM2_SEC"
else
  echo "PM2_ID and PM2_SEC must be set to link to PM2.io"
fi

# Start supervisord
exec /usr/bin/supervisord -n -c /usr/src/app/supervisord.conf
