# Fetch staging Postgres fields from VPS into .local-ssh/staging-dbeaver.env (gitignored).
# Usage (from repo root): .\scripts\fetch-staging-db-creds.ps1

$ErrorActionPreference = 'Stop'

$RepoRoot = Split-Path -Parent $PSScriptRoot
$KeyPath = Join-Path $RepoRoot '.local-ssh\id_ed25519'
$OutFile = Join-Path $RepoRoot '.local-ssh\staging-dbeaver.env'
$SshHost = if ($env:STAGING_SSH_HOST) { $env:STAGING_SSH_HOST } else { 'staging.dompet-tenang.web.id' }
$SshUser = if ($env:STAGING_SSH_USER) { $env:STAGING_SSH_USER } else { 'root' }
$SshPort = if ($env:STAGING_SSH_PORT) { $env:STAGING_SSH_PORT } else { '22' }

if (-not (Test-Path $KeyPath)) {
  Write-Error "SSH key not found: $KeyPath"
}

$remote = @'
set -euo pipefail
APP_DIR="${APP_DIR:-/opt/dompettenang}"
ENV_FILE="${APP_DIR}/deploy/.env.staging"
grep -E '^(POSTGRES_USER|POSTGRES_PASSWORD|POSTGRES_DB)=' "${ENV_FILE}"
echo "DB_HOST=localhost"
echo "DB_PORT=15432"
'@

$raw = & ssh `
  -i $KeyPath `
  -p $SshPort `
  -o IdentitiesOnly=yes `
  -o StrictHostKeyChecking=accept-new `
  "${SshUser}@${SshHost}" `
  $remote

$dir = Split-Path $OutFile
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }

@(
  '# Generated for DBeaver — do not commit'
  '# Host/Port assume .\scripts\staging-db-tunnel.ps1 is running'
  $raw
) | Set-Content -Path $OutFile -Encoding utf8

Write-Host "Wrote $OutFile"
Write-Host ""
Write-Host "DBeaver:"
Get-Content $OutFile | ForEach-Object {
  if ($_ -match '^POSTGRES_PASSWORD=') {
    Write-Host "POSTGRES_PASSWORD=***"
  } else {
    Write-Host $_
  }
}
