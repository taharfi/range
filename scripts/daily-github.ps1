$ErrorActionPreference = 'Stop'
$workspace = Split-Path -Parent $PSScriptRoot
$python = Join-Path $workspace '.venv\Scripts\python.exe'
$logDirectory = Join-Path $workspace '.git\range-security'
New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null
Set-Location -LiteralPath $workspace
& $python (Join-Path $PSScriptRoot 'safe_github.py') --snapshot *> (Join-Path $logDirectory 'daily-latest.log')
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
