#!/usr/bin/env bash
# WildMask DNS Daemon Uninstallation Script (macOS/Linux)

set -e

DOMAIN="${1:-test}"

echo "🎭 Uninstalling WildMask DNS Daemon..."
echo "Domain: .${DOMAIN}"
echo ""

# Detect OS
OS="$(uname -s)"

case "${OS}" in
  Darwin*)
    echo "Detected macOS"
    
    RESOLVER_FILE="/etc/resolver/${DOMAIN}"
    
    if [ -f "${RESOLVER_FILE}" ]; then
      echo "Removing resolver: ${RESOLVER_FILE}"
      sudo rm -f "${RESOLVER_FILE}"
      echo "✓ Resolver removed"
    else
      echo "ℹ Resolver not found, nothing to remove"
    fi
    ;;
    
  Linux*)
    echo "Detected Linux"
    
    RESOLVED_CONF="/etc/systemd/resolved.conf.d/wildmask-${DOMAIN}.conf"
    
    if [ -f "${RESOLVED_CONF}" ]; then
      echo "Removing configuration: ${RESOLVED_CONF}"
      sudo rm -f "${RESOLVED_CONF}"
      echo "✓ Configuration removed"
      
      echo "Restarting systemd-resolved..."
      sudo systemctl restart systemd-resolved
      echo "✓ systemd-resolved restarted"
    else
      echo "ℹ Configuration not found, nothing to remove"
    fi
    ;;
    
  *)
    echo "❌ Unsupported OS: ${OS}"
    exit 1
    ;;
esac

echo ""
echo "✅ Uninstallation complete!"


