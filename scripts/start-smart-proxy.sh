#!/bin/bash

# Script to start Smart Proxy on port 80

echo "🚀 Starting WildMask Smart Proxy on port 80..."
echo "=============================================="
echo ""
echo "This script requires sudo to use port 80"
echo ""

cd /Users/ivanrubiosubsierra/wildmask

# Stop previous proxy if exists
pkill -f "smart-proxy" 2>/dev/null

echo "🔧 Starting smart-proxy..."
sudo node packages/cli/dist/cli.js smart-proxy --port 80 > /tmp/smart-proxy-80.log 2>&1 &
PROXY_PID=$!

sleep 3

echo ""
echo "✅ Smart Proxy started on port 80"
echo ""
echo "📋 Now you can access WITHOUT specifying port:"
echo ""
echo "   # Wildcards (port in subdomain)"
echo "   curl http://3002.api.test/health"
echo "   curl http://3000.api.test/"
echo "   curl http://8080.api.test/"
echo ""
echo "   # Direct mappings (looks up port from config)"
echo "   curl http://test-api.test/health"
echo "   curl http://api.test/"
echo "   curl http://backend.myapp/"
echo ""
echo "📊 To view logs in real-time:"
echo "   tail -f /tmp/smart-proxy-80.log"
echo ""
echo "🛑 To stop the proxy:"
echo "   sudo pkill -f smart-proxy"
echo ""

