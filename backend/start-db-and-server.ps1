# Τρέξε με: δεξί κλικ → "Run with PowerShell" ως Διαχειριστής (αν η βάση δεν τρέχει).
# Μετά τρέξε κανονικά: npm start

$services = @('MariaDB', 'mysql')
foreach ($name in $services) {
    $svc = Get-Service -Name $name -ErrorAction SilentlyContinue
    if ($svc -and $svc.Status -ne 'Running') {
        try {
            Start-Service -Name $name
            Write-Host "Started service: $name"
        } catch {
            Write-Host "Could not start $name`: $_"
        }
    }
}

Set-Location $PSScriptRoot
Write-Host "`nStarting API (Ctrl+C to stop)...`n"
node server.js
