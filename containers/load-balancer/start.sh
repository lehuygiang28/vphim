#!/bin/bash

# Parse BACKEND_SERVERS environment variable
IFS=',' read -ra SERVERS <<< "$BACKEND_SERVERS"
UPSTREAM_CONFIG=""
SPLIT_CONFIG=""
MAP_CONFIG=""
TOTAL_SERVERS=${#SERVERS[@]}
LAST_INDEX=$((TOTAL_SERVERS - 1))

# Check if BACKEND_PERCENTAGES is set
if [ -z "$BACKEND_PERCENTAGES" ]; then
    # If not set, calculate equal percentages
    PERCENTAGE_PER_SERVER=$((100 / TOTAL_SERVERS))
    for ((i = 0; i < TOTAL_SERVERS; i++)); do
        PERCENTAGES[i]=$PERCENTAGE_PER_SERVER
    done
else
    # Parse BACKEND_PERCENTAGES if set
    IFS=',' read -ra PERCENTAGES <<< "$BACKEND_PERCENTAGES"
    
    # Validate that the number of percentages matches the number of servers
    if [[ ${#PERCENTAGES[@]} -ne $TOTAL_SERVERS ]]; then
        echo "Error: The number of percentages must match the number of servers."
        exit 1
    fi
    
    # Check for wildcard (*) in BACKEND_PERCENTAGES
    for i in "${!PERCENTAGES[@]}"; do
        # Ensure wildcard is in the last position
        if [[ "${PERCENTAGES[$i]}" == "*" ]]; then
            if [[ $i -ne LAST_INDEX ]]; then
                echo "Error: Wildcard (*) can only be used for the last server."
                exit 1
            fi
            # Do not change the wildcard
            continue
        fi
        
        # Ensure the percentage is a valid integer
        if ! [[ "${PERCENTAGES[$i]}" =~ ^[0-9]+$ ]]; then
            echo "Error: Percentages must be integers."
            exit 1
        fi
    done
fi

# Generate upstream configuration and split_clients mapping
for i in "${!SERVERS[@]}"; do
    SERVER="b$((i + 1))"
    HOST="${SERVERS[$i]}"
    PERCENTAGE="${PERCENTAGES[$i]}"
    
    # Add to upstream configuration
    UPSTREAM_CONFIG+="    upstream $SERVER { server $HOST:443; }"
    
    # Handle percentage formatting correctly
    if [[ "$PERCENTAGE" == "*" ]]; then
        SPLIT_CONFIG+="        * \"$SERVER\";"  # Wildcard case
    else
        SPLIT_CONFIG+="        ${PERCENTAGE}% \"$SERVER\";"  # Normal percentage case
    fi
    
    # Add to map configuration
    MAP_CONFIG+="    \"$SERVER\" \"$HOST\";"
done

# Export configurations for envsubst
export UPSTREAM_CONFIG
export SPLIT_CONFIG
export MAP_CONFIG

# Create a temporary file for the Nginx config
TEMP_CONFIG=$(mktemp)

# Use envsubst to replace environment variables in the template and write to the Nginx config file
envsubst '\$UPSTREAM_CONFIG \$SPLIT_CONFIG \$MAP_CONFIG' < /etc/nginx/nginx.conf.template > "$TEMP_CONFIG"

# Display the generated configuration for debugging
echo "$(<$TEMP_CONFIG)"

# Start Nginx with the generated configuration
exec nginx -c "$TEMP_CONFIG" -g 'daemon off;'
