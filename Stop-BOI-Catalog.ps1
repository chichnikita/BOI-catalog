$boiStatePath = Join-Path $PSScriptRoot '_runtime\catalog\server.json'
if (-not (Test-Path -LiteralPath $boiStatePath)) { Write-Output 'Catalog is not running.'; exit 0 }
$boiState = Get-Content -LiteralPath $boiStatePath -Raw | ConvertFrom-Json
$boiCatalogProcess = Get-Process -Id $boiState.pid -ErrorAction SilentlyContinue
if ($boiCatalogProcess -and $boiCatalogProcess.Path -eq $boiState.executable -and $boiCatalogProcess.StartTime.ToUniversalTime().Ticks -eq $boiState.startTicks) {
    Stop-Process -Id $boiCatalogProcess.Id
    Write-Output 'Catalog stopped.'
}
