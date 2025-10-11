# WildMask DNS Daemon Installation Script (Windows)
# Run with: powershell -ExecutionPolicy Bypass -File install-daemon.ps1

param(
    [string]$Domain = "test",
    [int]$Port = 5353
)

Write-Host "🎭 Installing WildMask DNS Daemon..." -ForegroundColor Cyan
Write-Host "Domain: .$Domain"
Write-Host "Port: $Port"
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ This script must be run as Administrator" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

Write-Host "Detected Windows" -ForegroundColor Green

# Get network adapters
$adapters = Get-NetAdapter | Where-Object { $_.Status -eq "Up" }

if ($adapters.Count -eq 0) {
    Write-Host "❌ No active network adapters found" -ForegroundColor Red
    exit 1
}

Write-Host "Configuring DNS for active adapters..."

foreach ($adapter in $adapters) {
    $adapterName = $adapter.Name
    Write-Host "  - $adapterName" -ForegroundColor Gray
    
    # Get current DNS servers
    $currentDNS = Get-DnsClientServerAddress -InterfaceAlias $adapterName -AddressFamily IPv4 | Select-Object -ExpandProperty ServerAddresses
    
    # Add 127.0.0.1 as primary DNS
    $newDNS = @("127.0.0.1") + $currentDNS
    
    try {
        Set-DnsClientServerAddress -InterfaceAlias $adapterName -ServerAddresses $newDNS
        Write-Host "    ✓ DNS configured" -ForegroundColor Green
    } catch {
        Write-Host "    ⚠ Failed to configure DNS: $_" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "✅ Installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠ Note: Windows DNS configuration may require additional setup" -ForegroundColor Yellow
Write-Host "Consider using third-party tools like Acrylic DNS Proxy for better local DNS support" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Start daemon: wildmask up"
Write-Host "  2. Verify: wildmask check api.$Domain"


