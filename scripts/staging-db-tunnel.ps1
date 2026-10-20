# SSH tunnel: local:15432 -> VPS localhost:15432 (staging Postgres).
# Keep this window open while using DBeaver.
#
# Usage (from repo root):
#   .\scripts\staging-db-tunnel.ps1
#
# DBeaver: Host localhost, Port 15432, DB/user from deploy/.env.staging on VPS.

$ErrorActionPreference = 'Stop'

$RepoRoot = Split-Path -Parent $PSScriptRoot
$KeyPath = Join-Path $RepoRoot '.local-ssh\id_ed25519'
$CredFile = Join-Path $RepoRoot '.local-ssh\staging-dbeaver.env'
$LocalPort = 15432

# Prefer explicit env, then values from fetch/prepare artifact, then defaults.
$SshHost = $env:STAGING_SSH_HOST
$SshUser = $env:STAGING_SSH_USER
$SshPort = $env:STAGING_SSH_PORT
if (Test-Path $CredFile) {
  Get-Content $CredFile | ForEach-Object {
    if ($_ -match '^SSH_HOST=(.+)$' -and -not $SshHost) { $SshHost = $Matches[1].Trim() }
    if ($_ -match '^SSH_USER=(.+)$' -and -not $SshUser) { $SshUser = $Matches[1].Trim() }
    if ($_ -match '^SSH_PORT=(.+)$' -and -not $SshPort) { $SshPort = $Matches[1].Trim() }
  }
}
if (-not $SshHost) { $SshHost = 'staging.dompet-tenang.web.id' }
if (-not $SshUser) { $SshUser = 'root' }
if (-not $SshPort) { $SshPort = '22' }

if (-not (Test-Path $KeyPath)) {
  Write-Error "SSH key not found: $KeyPath`nPlace the deploy private key there (see .local-ssh)."
}

Write-Host "Tunnel: localhost:$LocalPort -> ${SshUser}@${SshHost}:$LocalPort (staging Postgres)"
Write-Host "Leave this window open. Ctrl+C to stop."
Write-Host ""

& ssh `
  -i $KeyPath `
  -p $SshPort `
  -o IdentitiesOnly=yes `
  -o StrictHostKeyChecking=accept-new `
  -o ExitOnForwardFailure=yes `
  -o ServerAliveInterval=30 `
  -N `
  -L "${LocalPort}:127.0.0.1:${LocalPort}" `
  "${SshUser}@${SshHost}"
