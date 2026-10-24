param([string]$PythonPath)
$ErrorActionPreference = 'Stop'
$boiPythonArgs = @()
if (-not $PythonPath) {
    $boiLauncher = Get-Command py.exe -ErrorAction SilentlyContinue
    if ($boiLauncher) {
        $PythonPath = $boiLauncher.Source
        $boiPythonArgs = @('-3')
    } else {
        $boiCommand = Get-Command python.exe -ErrorAction SilentlyContinue
        if (-not $boiCommand) { throw 'Install Python 3.12+ from python.org, then run setup again.' }
        $PythonPath = $boiCommand.Source
    }
}
& $PythonPath @boiPythonArgs -c 'import sys; assert sys.version_info >= (3, 12), "Python 3.12+ is required"'
if ($LASTEXITCODE -ne 0) { throw 'Python 3.12+ is required.' }
$boiVenv = Join-Path $PSScriptRoot '.venv'
& $PythonPath @boiPythonArgs -m venv $boiVenv
if ($LASTEXITCODE -ne 0) { throw 'Could not create the local Python environment.' }
$boiVenvPython = Join-Path $boiVenv 'Scripts\python.exe'
& $boiVenvPython -m pip install -r (Join-Path $PSScriptRoot 'requirements.txt')
if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed. Run Setup-BOI-Catalog.ps1 again.' }
Write-Output 'Setup complete. Open Open-BOI-Catalog.cmd to start the catalog.'
