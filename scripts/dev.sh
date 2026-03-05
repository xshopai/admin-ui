#!/bin/bash

# Admin UI - Run without Dapr (local development)

echo "Starting Admin UI..."
echo "UI will be available at: http://localhost:3001"
echo ""
echo "Note: Make sure web-bff is running at http://localhost:8014"
echo ""

# Copy .env.example to .env only if .env does not already exist.
# In Codespaces, 03-env.sh pre-patches .env with the correct forwarded URLs
# (REACT_APP_BFF_URL, WDS_SOCKET_PORT) — overwriting it here would break the UI.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_DIR="$(dirname "$SCRIPT_DIR")"
if [ ! -f "$SERVICE_DIR/.env" ] && [ -f "$SERVICE_DIR/.env.example" ]; then
    cp "$SERVICE_DIR/.env.example" "$SERVICE_DIR/.env"
    echo "✅ Copied .env.example → .env"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Set port to 3001 to avoid conflict with customer-ui
PORT=3001 npm start
