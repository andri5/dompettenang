#!/usr/bin/env bash
# Dompet Tenang — remote production deploy (run on Sumopod VPS)
# Usage:
#   BRANCH=main APP_DIR=/opt/dompettenang ./deploy/remote-deploy.sh
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/dompettenang}"
BRANCH="${BRANCH:-main}"
COMPOSE_FILE="${COMPOSE_FILE:-deploy/docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-deploy/.env.production}"
HEALTH_URL="${HEALTH_URL:-https://dompet-tenang.web.id/api/v1/health}"

echo "==> Deploy Dompet Tenang"
echo "    APP_DIR=${APP_DIR}"
echo "    BRANCH=${BRANCH}"

cd "${APP_DIR}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "ERROR: missing ${APP_DIR}/${ENV_FILE}"
  echo "Copy from deploy/.env.production.example and fill secrets on the server."
  exit 1
fi

echo "==> Fetching ${BRANCH}"
git fetch origin "${BRANCH}"
git checkout "${BRANCH}"
git pull --ff-only origin "${BRANCH}"

echo "==> Building and restarting containers"
docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" up -d --build

echo "==> Container status"
docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" ps

echo "==> Health check (API container)"
ok=0
for i in 1 2 3 4 5 6; do
  if docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" exec -T api \
    node -e "fetch('http://127.0.0.1:3001/api/v1/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" \
    >/dev/null 2>&1; then
    ok=1
    break
  fi
  echo "    attempt ${i}/6 failed, waiting..."
  sleep 5
done

if [[ "${ok}" -ne 1 ]]; then
  echo "ERROR: API health check failed inside the api container."
  docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" logs --tail 40 api || true
  exit 1
fi

echo "==> Optional public URL check: ${HEALTH_URL}"
if curl -fsSL --connect-timeout 5 --max-time 20 "${HEALTH_URL}" >/dev/null 2>&1; then
  echo "    public health OK"
else
  echo "    public health skipped/failed (TLS/DNS). API container is healthy."
fi

echo "==> Deploy OK"
