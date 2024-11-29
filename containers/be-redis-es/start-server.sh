#!/bin/bash

# Wait until Redis started and listens on port 6379.
while [ -z "`netstat -tln | grep 6379`" ]; do
  echo 'Waiting for Redis to start ...'
  sleep 1
done
echo 'Redis started.'

# Wait until Elasticsearch started and listens on port 9200.
while [ -z "`netstat -tln | grep 9200`" ]; do
  echo 'Waiting for Elasticsearch to start ...'
  sleep 1
done
echo 'Elasticsearch started.'

# Start server.
echo 'Starting server...'
node /usr/src/app/dist/apps/api/main
