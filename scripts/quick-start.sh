
#!/bin/bash

# WildMask Quick Start Script
# This script sets up everything needed to start using WildMask

set -e

echo "🎭 WildMask Quick Start"
echo "======================="
echo ""

cd /Users/ivanrubiosubsierra/wildmask

# Function for commands
wm() {
    node packages/cli/dist/cli.js "$@"
}

echo "📋 Checking existing configuration..."
if wm config path > /dev/null 2>&1; then
    echo "✅ Configuration found"
else
    echo "🔧 Initializing configuration..."
    wm init --force
fi
echo ""

echo "📋 Checking DNS resolver..."
if [ -f /etc/resolver/test ]; then
    echo "✅ Resolver installed"
else
    echo "⚠️  Resolver not installed"
    echo "   Run: sudo wildmask install"
    echo "   (Requires password)"
fi
echo ""

echo "📋 Starting DNS daemon..."
wm down 2>/dev/null || true
sleep 1
wm up
echo ""

echo "📋 Daemon status:"
wm status
echo ""

echo "📋 Configured mappings:"
wm list
echo ""

echo "🎉 Setup complete!"
echo ""
echo "💡 Options:"
echo ""
echo "1️⃣  Launch TUI dashboard:"
echo "   wm"
echo ""
echo "2️⃣  Start Smart Proxy (port-free access):"
echo "   sudo wm smart-proxy --port 80"
echo ""
echo "3️⃣  Add new mapping:"
echo "   wm add myapp --target 127.0.0.1 --port 3000"
echo ""
echo "4️⃣  Launch test server:"
echo "   wm serve-api --port 3000 --name test --add"
echo ""
echo "5️⃣  Test functionality:"
echo "   curl http://test-api.test:3002/health"
echo "   (or without port if smart-proxy is running)"
echo ""
echo "📚 Complete documentation:"
echo "   - docs/installation.md - Installation guide"
echo "   - docs/proxy-guide.md - Proxy guide"
echo "   - docs/install-dns.md - DNS installation"
echo ""

