#!/bin/sh
# Docker entrypoint script for admin-ui
# Substitutes environment variables in nginx config at container startup

set -e

# Default BFF_URL if not set
BFF_URL=${BFF_URL:-"http://localhost:8014"}

# Extract hostname from BFF_URL for the Host header
# Removes protocol (http:// or https://) and any trailing path/port
BFF_HOST=$(echo "$BFF_URL" | sed -e 's|^https\?://||' -e 's|/.*$||' -e 's|:[0-9]*$||')

echo "🔧 Configuring nginx with:"
echo "   BFF_URL:  ${BFF_URL}"
echo "   BFF_HOST: ${BFF_HOST}"

# Export BFF_HOST for envsubst
export BFF_HOST

# Create nginx config with environment variable substitution
envsubst '${BFF_URL} ${BFF_HOST}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

echo "✅ Nginx configuration updated"

# Execute the main command (nginx)
exec "$@"
