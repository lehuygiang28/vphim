#!/bin/sh

# Start supervisord
exec /usr/bin/supervisord -c /usr/src/app/supervisord.conf
