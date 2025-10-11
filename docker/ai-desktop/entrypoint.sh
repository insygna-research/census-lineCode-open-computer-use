#!/bin/bash
# Entrypoint script that detects environment and runs appropriate startup

# Function to detect if running in Azure
is_azure() {
    # Check for Azure-specific environment variables or metadata
    if [ -n "$AZURE_CONTAINER_INSTANCE" ] || \
       [ -n "$WEBSITE_INSTANCE_ID" ] || \
       [ -f /etc/kubernetes/azure.json ] || \
       curl -s -f -m 2 http://169.254.169.254/metadata/instance?api-version=2021-02-01 -H "Metadata:true" > /dev/null 2>&1; then
        return 0
    fi
    return 1
}

echo "Container environment detection..."

# Detect environment
if is_azure; then
    echo "Detected Azure environment - using Azure-optimized startup"
    exec /opt/.system/startup.azure.sh
else
    echo "Running in standard environment (local/Docker)"
    exec /opt/.system/startup.sh
fi