#!/bin/sh
set -e

echo "Starting Cloudflare Tunnel..."
echo "This will create a temporary HTTPS URL for your server"
echo ""

# Run cloudflared tunnel with auto-generated URL
exec cloudflared tunnel --url http://server:3000 --no-autoupdate
