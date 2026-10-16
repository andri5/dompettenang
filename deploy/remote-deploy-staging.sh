#!/usr/bin/env bash
# Dompet Tenang — remote staging deploy (run on Sumopod VPS)
# Usage:
#   SKIP_GIT=1 APP_DIR=/opt/dompettenang ./deploy/remote-deploy-staging.sh
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/dompettenang}"
BRANCH="${BRANCH:-feature/testing-qa}"
COMPOSE_FILE="${COMPOSE_FILE:-deploy/docker-compose.staging.yml}"
PROD_COMPOSE="${PROD_COMPOSE:-deploy/docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-deploy/.env.staging}"
PROD_ENV="${PROD_ENV:-deploy/.env.production}"
HEALTH_URL="${HEALTH_URL:-https://staging.dompet-tenang.web.id/api/v1/health}"
SKIP_GIT="${SKIP_GIT:-0}"

echo "==> Deploy Dompet Tenang STAGING"
echo "    APP_DIR=${APP_DIR}"
echo "    BRANCH=${BRANCH}"
echo "    SKIP_GIT=${SKIP_GIT}"

cd "${APP_DIR}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "ERROR: missing ${APP_DIR}/${ENV_FILE}"
  echo "Copy from deploy/.env.staging.example or run Actions → Bootstrap staging env."
  exit 1
fi

if [[ ! -f "${PROD_ENV}" ]]; then
  echo "ERROR: missing ${APP_DIR}/${PROD_ENV} (needed to reload Caddy)"
  exit 1
fi

if [[ "${SKIP_GIT}" != "1" ]]; then
  echo "==> Fetching ${BRANCH}"
  git fetch origin "${BRANCH}"
  git checkout "${BRANCH}"
  git pull --ff-only origin "${BRANCH}"
else
  echo "==> SKIP_GIT=1 (using files already on disk)"
fi

# Ensure production edge network exists (Caddy)
if ! docker network inspect dompettenang_internal >/dev/null 2>&1; then
  echo "ERROR: docker network dompettenang_internal not found."
  echo "Start production stack first so Caddy/network exist."
  exit 1
fi

echo "==> Building and restarting STAGING containers"
# Remove legacy service names that collided with production DNS (api/web on prod_edge)
docker compose -p dompettenang-staging -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" down --remove-orphans || true
docker compose -p dompettenang-staging -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" up -d --build --force-recreate

echo "==> Restore production api/web DNS + reload Caddy"
# Staging used to register as hostname "api"/"web" on the shared network.
docker compose -f "${PROD_COMPOSE}" --env-file "${PROD_ENV}" up -d --force-recreate api web caddy

echo "==> Staging container status"
docker compose -p dompettenang-staging -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" ps

echo "==> Health check (staging API container)"
ok=0
for i in 1 2 3 4 5 6 7 8; do
  if docker compose -p dompettenang-staging -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" exec -T api-staging \
    node -e "fetch('http://127.0.0.1:3001/api/v1/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" \
    >/dev/null 2>&1; then
    ok=1
    break
  fi
  echo "    attempt ${i}/8 failed, waiting..."
  sleep 5
done

if [[ "${ok}" -ne 1 ]]; then
  echo "ERROR: Staging API health check failed."
  docker compose -p dompettenang-staging -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" logs --tail 50 api-staging || true
  exit 1
fi

echo "==> Optional public URL check: ${HEALTH_URL}"
if curl -fsSL --connect-timeout 5 --max-time 25 "${HEALTH_URL}" >/dev/null 2>&1; then
  echo "    public staging health OK"
else
  echo "    public health skipped/failed — add DNS A record staging.DOMAIN → VPS IP, wait for TLS."
fi

echo "==> Staging deploy OK"
