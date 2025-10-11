#!/usr/bin/env bash
# WildMask DNS Daemon Installation Script (macOS/Linux)

set -e

DOMAIN="${1:-test}"
PORT="${2:-5353}"

echo "🎭 Installing WildMask DNS Daemon..."
echo "Domain: .${DOMAIN}"
echo "Port: ${PORT}"
echo ""

# Detect OS
OS="$(uname -s)"

case "${OS}" in
  Darwin*)
    echo "Detected macOS"
    
    # Create /etc/resolver directory
    if [ ! -d "/etc/resolver" ]; then
      echo "Creating /etc/resolver directory..."
      sudo mkdir -p /etc/resolver
    fi
    
    # Create resolver file for domain
    RESOLVER_FILE="/etc/resolver/${DOMAIN}"
    echo "Creating resolver: ${RESOLVER_FILE}"
    
    cat <<EOF | sudo tee "${RESOLVER_FILE}" > /dev/null
nameserver 127.0.0.1
port ${PORT}
EOF
    
    echo "✓ Resolver installed"
    
    # Verify
    if [ -f "${RESOLVER_FILE}" ]; then
      echo "✓ Resolver verified"
      scutil --dns | grep -A 5 "${DOMAIN}" || true
    fi
    
    echo ""
    echo "✅ Installation complete!"
    echo ""
    echo "To verify DNS resolution:"
    echo "  scutil --dns | grep ${DOMAIN}"
    echo "  ping api.${DOMAIN}"
    ;;
    
  Linux*)
    echo "Detected Linux"
    
    # Check if systemd-resolved is available
    if command -v resolvectl &> /dev/null || command -v systemd-resolve &> /dev/null; then
      echo "Using systemd-resolved..."
      
      # Create resolved configuration
      RESOLVED_CONF="/etc/systemd/resolved.conf.d/wildmask-${DOMAIN}.conf"
      
      echo "Creating configuration: ${RESOLVED_CONF}"
      
      sudo mkdir -p /etc/systemd/resolved.conf.d
      
      cat <<EOF | sudo tee "${RESOLVED_CONF}" > /dev/null
[Resolve]
DNS=127.0.0.1:${PORT}
Domains=~${DOMAIN}
EOF
      
      echo "✓ Configuration created"
      echo "Restarting systemd-resolved..."
      sudo systemctl restart systemd-resolved
      
      echo "✓ systemd-resolved restarted"
    else
      echo "⚠ systemd-resolved not found"
      echo "Manual configuration required. Add to /etc/resolv.conf:"
      echo "  nameserver 127.0.0.1"
    fi
    
    echo ""
    echo "✅ Installation complete!"
    ;;
    
  *)
    echo "❌ Unsupported OS: ${OS}"
    echo "Manual configuration required"
    exit 1
    ;;
esac

echo ""
echo "Next steps:"
echo "  1. Start daemon: wildmask up"
echo "  2. Verify: wildmask check api.${DOMAIN}"


