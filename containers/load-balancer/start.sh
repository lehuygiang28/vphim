#!/bin/bash

# Check if UPSTREAM_SERVERS is set
if [ -z "$UPSTREAM_SERVERS" ]; then
    echo "Error: UPSTREAM_SERVERS environment variable is not set."
    exit 1
fi

# Convert comma-separated list to array
IFS=',' read -ra SERVERS <<< "$UPSTREAM_SERVERS"

# Generate upstream configuration
UPSTREAM_CONFIG=""
SERVER_CONFIGS=""
for i in "${!SERVERS[@]}"; do
    server="${SERVERS[$i]}"
    port=$((8000 + i))
    UPSTREAM_CONFIG+=$(echo -e "        server 127.0.0.1:$port max_fails=3 fail_timeout=30s;\n")

    SERVER_CONFIGS+=$(echo -e "    server {\n")
    SERVER_CONFIGS+=$(echo -e "        listen $port;\n")
    SERVER_CONFIGS+=$(echo -e "        server_name $server;\n")
    SERVER_CONFIGS+=$(echo -e "        access_log off;\n")
    SERVER_CONFIGS+=$(echo -e "        location / {\n")
    SERVER_CONFIGS+=$(echo -e "            proxy_pass https://$server;\n")
    SERVER_CONFIGS+=$(echo -e "            proxy_set_header Host $server;\n")
    SERVER_CONFIGS+=$(echo -e "            proxy_set_header X-Host $server;\n")
    SERVER_CONFIGS+=$(echo -e "            add_header X-Lb-Server b$i always;\n")
    SERVER_CONFIGS+=$(echo -e "        }\n")
    SERVER_CONFIGS+=$(echo -e "    }\n\n")
done

# Set the auth server to the first server in the list
AUTH_SERVER="http://127.0.0.1:8000"

# Export variables for envsubst
export UPSTREAM_CONFIG
export SERVER_CONFIGS
export AUTH_SERVER

# Create temporary config file
TEMP_CONFIG=$(mktemp)

# Generate the final nginx configuration
envsubst '${UPSTREAM_CONFIG} ${SERVER_CONFIGS} ${AUTH_SERVER}' < /etc/nginx/nginx.conf.template > "$TEMP_CONFIG"

# Print the generated configuration for debugging
echo "Generated Nginx configuration:"
cat "$TEMP_CONFIG"

# Start Nginx with the generated config
exec nginx -c "$TEMP_CONFIG" -g 'daemon off;'
