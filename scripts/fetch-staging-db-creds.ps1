# Fetch staging Postgres fields into .local-ssh/staging-dbeaver.env (gitignored).
#
# Prefer GitHub Actions (works when local SSH to VPS is blocked):
#   gh workflow run "Prepare staging DBeaver" --ref feature/testing-qa
#   gh run download <run_id> -n staging-dbeaver-env -D .local-ssh
#
# Or direct SSH (needs outbound access to PROD_SSH_HOST:PORT):
#   .\scripts\fetch-staging-db-creds.ps1

$ErrorActionPreference = 'Stop'

$RepoRoot = Split-Path -Parent $PSScriptRoot
$KeyPath = Join-Path $RepoRoot '.local-ssh\id_ed25519'
$OutFile = Join-Path $RepoRoot '.local-ssh\staging-dbeaver.env'
$OutDir = Split-Path $OutFile

# If artifact already downloaded, just show redacted summary.
if ($args -contains '-FromArtifact' -or ((Test-Path $OutFile) -and ($args -contains '-Show'))) {
  if (-not (Test-Path $OutFile)) { Write-Error "Missing $OutFile — download the Actions artifact first." }
  Write-Host "DBeaver creds file: $OutFile"
  Get-Content $OutFile | ForEach-Object {
    if ($_ -match '^POSTGRES_PASSWORD=') { 'POSTGRES_PASSWORD=***' } else { $_ }
  }
  exit 0
}

$SshHost = $env:STAGING_SSH_HOST
$SshUser = $env:STAGING_SSH_USER
$SshPort = $env:STAGING_SSH_PORT
if (Test-Path $OutFile) {
  Get-Content $OutFile | ForEach-Object {
    if ($_ -match '^SSH_HOST=(.+)$' -and -not $SshHost) { $SshHost = $Matches[1].Trim() }
    if ($_ -match '^SSH_USER=(.+)$' -and -not $SshUser) { $SshUser = $Matches[1].Trim() }
    if ($_ -match '^SSH_PORT=(.+)$' -and -not $SshPort) { $SshPort = $Matches[1].Trim() }
  }
}
if (-not $SshHost) { $SshHost = 'staging.dompet-tenang.web.id' }
if (-not $SshUser) { $SshUser = 'root' }
if (-not $SshPort) { $SshPort = '22' }

if (-not (Test-Path $KeyPath)) {
  Write-Error "SSH key not found: $KeyPath"
}

$remote = @'
set -euo pipefail
APP_DIR="${APP_DIR:-/opt/dompettenang}"
ENV_FILE="${APP_DIR}/deploy/.env.staging"
echo "# Generated for DBeaver — do not commit"
echo "# Host/Port assume .\scripts\staging-db-tunnel.ps1 is running"
echo "DB_HOST=localhost"
echo "DB_PORT=15432"
grep -E '^(POSTGRES_USER|POSTGRES_PASSWORD|POSTGRES_DB)=' "${ENV_FILE}"
'@

Write-Host "SSH ${SshUser}@${SshHost}:${SshPort} ..."
$raw = & ssh `
  -i $KeyPath `
  -p $SshPort `
  -o IdentitiesOnly=yes `
  -o StrictHostKeyChecking=accept-new `
  -o ConnectTimeout=15 `
  "${SshUser}@${SshHost}" `
  $remote
if ($LASTEXITCODE -ne 0) {
  Write-Error @"
SSH failed (exit $LASTEXITCODE). If port 22 is blocked on this network, use Actions instead:

  gh workflow run "Prepare staging DBeaver" --ref feature/testing-qa
  # wait for success, then:
  gh run list --workflow=prepare-staging-dbeaver.yml --limit 1
  gh run download <RUN_ID> -n staging-dbeaver-env -D .local-ssh
"@
}

if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir | Out-Null }

@(
  $raw
  "SSH_HOST=$SshHost"
  "SSH_USER=$SshUser"
  "SSH_PORT=$SshPort"
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
