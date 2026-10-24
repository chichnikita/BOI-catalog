param(
    [switch]$NoBrowser,
    [ValidateRange(1, 65525)][int]$Port = 8765,
    [string]$PythonPath = $env:BOI_CATALOG_PYTHON
)
$ErrorActionPreference = 'Stop'
$boiSite = Join-Path $PSScriptRoot 'BOI-Catalog'
$boiRuntime = Join-Path $PSScriptRoot '_runtime\catalog'
if (-not $PythonPath) {
    $PythonPath = Join-Path $PSScriptRoot '.venv\Scripts\python.exe'
    if (-not (Test-Path -LiteralPath $PythonPath)) {
        & (Join-Path $PSScriptRoot 'Setup-BOI-Catalog.ps1')
    }
}
if (-not (Test-Path -LiteralPath $PythonPath)) { throw 'Python not found. Run Setup-BOI-Catalog.ps1 or pass -PythonPath.' }
$boiPython = (Resolve-Path -LiteralPath $PythonPath).Path
& $boiPython -c 'import sys, PIL; assert sys.version_info >= (3, 12), "Python 3.12+ is required"'
if ($LASTEXITCODE -ne 0) { throw 'Python 3.12+ with Pillow is required. Run Setup-BOI-Catalog.ps1.' }
New-Item -ItemType Directory -Path $boiRuntime -Force | Out-Null
$boiUrl = $null
foreach ($boiPort in $Port..($Port + 10)) {
    $boiCandidate = "http://127.0.0.1:$boiPort"
    try {
        $boiHealth = Invoke-RestMethod -Uri "$boiCandidate/api/health" -TimeoutSec 1
        if ($boiHealth.app -eq 'boi-catalog') { $boiUrl = $boiCandidate; break }
    } catch {}
    $boiListener = Get-NetTCPConnection -LocalPort $boiPort -State Listen -ErrorAction SilentlyContinue
    if ($boiListener) { continue }
    $boiServerPath = Join-Path $boiSite 'server.py'
    $boiProcess = Start-Process -FilePath $boiPython -ArgumentList @('-u', ('"' + $boiServerPath + '"'), '--port', $boiPort) -WorkingDirectory $boiSite -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $boiRuntime 'server.log') -RedirectStandardError (Join-Path $boiRuntime 'server-error.log')
    for ($boiAttempt = 0; $boiAttempt -lt 45; $boiAttempt++) {
        Start-Sleep -Milliseconds 400
        try {
            $boiHealth = Invoke-RestMethod -Uri "$boiCandidate/api/health" -TimeoutSec 1
            if ($boiHealth.app -eq 'boi-catalog') { $boiUrl = $boiCandidate; break }
        } catch {}
        $boiProcess.Refresh()
        if ($boiProcess.HasExited) { break }
    }
    if ($boiUrl) {
        @{ pid = $boiProcess.Id; startTicks = $boiProcess.StartTime.ToUniversalTime().Ticks; executable = $boiPython; url = $boiUrl } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $boiRuntime 'server.json') -Encoding UTF8
        break
    }
    throw 'Catalog failed to start. See _runtime\catalog\server-error.log'
}
if (-not $boiUrl) { throw 'No free port found in the requested range.' }
Write-Output "$boiUrl/"
if (-not $NoBrowser) { Start-Process "$boiUrl/" }
