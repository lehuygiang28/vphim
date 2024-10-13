#!/bin/sh

sudo sysctl -p

# Start supervisord
exec /usr/bin/supervisord -c /usr/src/app/supervisord.conf
