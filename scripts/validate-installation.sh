#!/bin/bash

# WildMask Installation Validation Script
# Verifies that everything is working correctly

# Don't exit on error, we want to continue checking
set +e

echo "🔍 WildMask Installation Validation"
echo "===================================="
echo ""

cd /Users/ivanrubiosubsierra/wildmask

# Helper function
wm() {
    node packages/cli/dist/cli.js "$@"
}

CHECKS_PASSED=0
CHECKS_FAILED=0

# Helper functions
check_pass() {
    echo "✅ $1"
    ((CHECKS_PASSED++))
}

check_fail() {
    echo "❌ $1"
    ((CHECKS_FAILED++))
}

check_warn() {
    echo "⚠️  $1"
}

echo "1️⃣  Verifying build..."
if [ -f "packages/cli/dist/cli.js" ]; then
    check_pass "CLI compiled"
else
    check_fail "CLI not compiled - run: pnpm build"
fi

if [ -f "packages/tui/dist/index.js" ]; then
    check_pass "TUI compiled"
else
    check_fail "TUI not compiled - run: pnpm build"
fi
echo ""

echo "2️⃣  Verifying configuration..."
if wm config path > /dev/null 2>&1; then
    check_pass "Config file exists"
    
    if wm config validate > /dev/null 2>&1; then
        check_pass "Config is valid"
    else
        check_fail "Config is invalid"
    fi
else
    check_warn "Config doesn't exist - run: wildmask init"
fi
echo ""

echo "3️⃣  Verifying DNS resolver..."
if [ -f "/etc/resolver/test" ]; then
    check_pass "Resolver installed (/etc/resolver/test)"
    
    # Verify content
    if grep -q "nameserver 127.0.0.1" /etc/resolver/test; then
        check_pass "Resolver configured correctly"
    else
        check_fail "Resolver misconfigured"
    fi
else
    check_warn "Resolver not installed - run: sudo wildmask install"
fi
echo ""

echo "4️⃣  Verifying DNS daemon..."
if wm status | grep -q "Running"; then
    check_pass "Daemon running"
    
    # Verify port
    PORT=$(wm status | grep "Port" | awk '{print $NF}')
    if lsof -i :$PORT | grep -q "LISTEN"; then
        check_pass "Daemon listening on port $PORT"
    else
        check_fail "Daemon not listening on port $PORT"
    fi
else
    check_warn "Daemon not running - run: wildmask up"
fi
echo ""

echo "5️⃣  Verifying mappings..."
MAPPING_COUNT=$(wm list 2>/dev/null | grep -c "│" | tail -1 || echo "0")
if [ "$MAPPING_COUNT" -gt "3" ]; then
    check_pass "$MAPPING_COUNT mappings configured"
else
    check_warn "Only $MAPPING_COUNT mappings - add more with: wildmask add"
fi
echo ""

echo "6️⃣  Verifying DNS resolution..."
if dscacheutil -q host -a name api.test 2>/dev/null | grep -q "127.0.0.1"; then
    check_pass "DNS resolves api.test → 127.0.0.1"
else
    check_warn "DNS not resolving - check daemon and resolver"
fi
echo ""

echo "7️⃣  Verifying connectivity..."
if wm check test-api.test 2>/dev/null | grep -q "HEALTHY"; then
    check_pass "Health check works"
else
    check_warn "Health check failed - verify service is running"
fi
echo ""

echo "8️⃣  Verifying additional commands..."
if wm completion bash > /dev/null 2>&1; then
    check_pass "Completion scripts available"
else
    check_fail "Completion scripts not working"
fi

if wm doctor > /dev/null 2>&1; then
    check_pass "Doctor command works"
else
    check_warn "Doctor command has warnings"
fi
echo ""

echo "9️⃣  Verifying test servers..."
if ps aux | grep -q "serve-api" | grep -v grep; then
    check_pass "Dummy servers available"
else
    check_warn "No dummy servers running - start with: wildmask serve-api --port 3000"
fi
echo ""

echo "🔟 Verifying smart proxy..."
if lsof -i :80 2>/dev/null | grep -q "node"; then
    check_pass "Smart proxy running on port 80"
    
    # Basic test
    if curl -s -m 2 http://test-api.test/health 2>/dev/null | grep -q "healthy"; then
        check_pass "Smart proxy works correctly"
    else
        check_warn "Smart proxy running but not responding"
    fi
else
    check_warn "Smart proxy not running - start with: sudo wildmask smart-proxy --port 80"
fi
echo ""

echo "===================================="
echo "📊 Validation Summary"
echo "===================================="
echo ""
echo "✅ Checks passed: $CHECKS_PASSED"
echo "❌ Checks failed: $CHECKS_FAILED"
echo ""

if [ "$CHECKS_FAILED" -eq 0 ]; then
    echo "🎉 Everything works correctly!"
    echo ""
    echo "🚀 Next steps:"
    echo "   1. Start smart-proxy: sudo wildmask smart-proxy --port 80"
    echo "   2. Launch TUI: wildmask"
    echo "   3. Add more mappings: wildmask add myapp --target 127.0.0.1 --port 3000"
    echo ""
else
    echo "⚠️  There are some issues. Review the failed checks above."
    echo ""
    echo "💡 Useful commands:"
    echo "   wildmask doctor --fix    # Auto-fix issues"
    echo "   wildmask config validate # Verify config"
    echo "   sudo wildmask install    # Install DNS resolver"
    echo "   wildmask up              # Start daemon"
    echo ""
fi

