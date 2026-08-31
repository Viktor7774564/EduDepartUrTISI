# DEV-HTTPS: local certificates only. Delete certs/ before production.
$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$nodeScript = Join-Path $scriptDir 'generate-certs.mjs'

if (-not (Test-Path $nodeScript)) {
  Write-Host 'generate-certs.mjs not found.' -ForegroundColor Red
  exit 1
}

node $nodeScript
