#!/bin/sh

# Start supervisord
exec /usr/bin/supervisord -n -c /usr/src/app/supervisord.conf
