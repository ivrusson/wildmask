# WildMask DNS Daemon Uninstallation Script (Windows)
# Run with: powershell -ExecutionPolicy Bypass -File uninstall-daemon.ps1

param(
    [string]$Domain = "test"
)

Write-Host "🎭 Uninstalling WildMask DNS Daemon..." -ForegroundColor Cyan
Write-Host "Domain: .$Domain"
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ This script must be run as Administrator" -ForegroundColor Red
    exit 1
}

Write-Host "Detected Windows" -ForegroundColor Green

# Get network adapters
$adapters = Get-NetAdapter | Where-Object { $_.Status -eq "Up" }

Write-Host "Restoring DNS configuration for active adapters..."

foreach ($adapter in $adapters) {
    $adapterName = $adapter.Name
    Write-Host "  - $adapterName" -ForegroundColor Gray
    
    # Get current DNS servers
    $currentDNS = Get-DnsClientServerAddress -InterfaceAlias $adapterName -AddressFamily IPv4 | Select-Object -ExpandProperty ServerAddresses
    
    # Remove 127.0.0.1 from DNS servers
    $newDNS = $currentDNS | Where-Object { $_ -ne "127.0.0.1" }
    
    try {
        if ($newDNS.Count -gt 0) {
            Set-DnsClientServerAddress -InterfaceAlias $adapterName -ServerAddresses $newDNS
        } else {
            # Reset to DHCP if no DNS servers left
            Set-DnsClientServerAddress -InterfaceAlias $adapterName -ResetServerAddresses
        }
        Write-Host "    ✓ DNS restored" -ForegroundColor Green
    } catch {
        Write-Host "    ⚠ Failed to restore DNS: $_" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "✅ Uninstallation complete!" -ForegroundColor Green


