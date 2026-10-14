#!/usr/bin/env bash
# Upload Android APK to VPS so it is served at:
#   https://DOMAIN/download/dompet-tenang.apk
#
# Usage:
#   ./deploy/publish-apk.sh /path/to/app-release.apk
#   ./deploy/publish-apk.sh https://expo.dev/.../artifact.apk
#
# Env (optional):
#   DEPLOY_HOST   default: root@YOUR_VPS_IP
#   DEPLOY_PATH   default: /opt/duitdiary/deploy/downloads
#   APK_NAME      default: dompet-tenang.apk

set -euo pipefail

SRC="${1:-}"
if [[ -z "$SRC" ]]; then
  echo "Usage: $0 <local-apk-path-or-https-url>"
  exit 1
fi

DEPLOY_HOST="${DEPLOY_HOST:-}"
DEPLOY_PATH="${DEPLOY_PATH:-/opt/duitdiary/deploy/downloads}"
APK_NAME="${APK_NAME:-dompet-tenang.apk}"

if [[ -z "$DEPLOY_HOST" ]]; then
  echo "Set DEPLOY_HOST first, e.g.:"
  echo "  export DEPLOY_HOST=root@43.133.135.215"
  exit 1
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
LOCAL_APK="$TMP/$APK_NAME"

if [[ "$SRC" == https://* || "$SRC" == http://* ]]; then
  echo "Downloading APK…"
  curl -fsSL -o "$LOCAL_APK" "$SRC"
else
  if [[ ! -f "$SRC" ]]; then
    echo "File not found: $SRC"
    exit 1
  fi
  cp "$SRC" "$LOCAL_APK"
fi

SIZE="$(wc -c < "$LOCAL_APK" | tr -d ' ')"
echo "Uploading $APK_NAME ($SIZE bytes) → $DEPLOY_HOST:$DEPLOY_PATH/"
ssh "$DEPLOY_HOST" "mkdir -p '$DEPLOY_PATH'"
scp "$LOCAL_APK" "$DEPLOY_HOST:$DEPLOY_PATH/$APK_NAME"
echo "Done. Public URL: https://dompet-tenang.web.id/download/$APK_NAME"
echo "Tip: jika baru pertama kali, pastikan Caddy volume ./downloads sudah di-mount lalu reload compose."
