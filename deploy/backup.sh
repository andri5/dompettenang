#!/usr/bin/env bash
# Daily production backup: Postgres custom dump + uploads archive.
# Writes outside the app tree so a deploy rsync cannot delete it.
#
#   APP_DIR=/opt/dompettenang /usr/local/sbin/dompettenang-backup
#   /usr/local/sbin/dompettenang-backup --restore-test
#
# Optional offsite copy: set BACKUP_RCLONE_DEST in deploy/.env.production
# (an rclone remote that already exists on this host). The dump is never printed.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/dompettenang}"
COMPOSE_FILE="${COMPOSE_FILE:-${APP_DIR}/deploy/docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-${APP_DIR}/deploy/.env.production}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/dompettenang}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
RESTORE_TEST=0

if [[ "${1:-}" == "--restore-test" ]]; then
  RESTORE_TEST=1
elif [[ -n "${1:-}" ]]; then
  echo "usage: dompettenang-backup [--restore-test]" >&2
  exit 2
fi

if [[ ! -f "${COMPOSE_FILE}" || ! -f "${ENV_FILE}" ]]; then
  echo "ERROR: missing compose or env file under ${APP_DIR}" >&2
  exit 1
fi

umask 077
mkdir -p "${BACKUP_DIR}" /var/lock
chmod 700 "${BACKUP_DIR}"

exec 9>/var/lock/dompettenang-backup.lock
if ! flock -n 9; then
  echo "backup already running"
  exit 0
fi

compose() {
  docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" "$@"
}

env_value() {
  local key="$1"
  local line
  line="$(grep -E "^${key}=" "${ENV_FILE}" | tail -n 1 || true)"
  line="${line#*=}"
  line="${line%$'\r'}"
  line="${line#\"}"
  line="${line%\"}"
  line="${line#\'}"
  line="${line%\'}"
  printf '%s' "${line}"
}

WORKDIR="$(mktemp -d)"
cleanup() {
  rm -rf "${WORKDIR}"
  if [[ -n "${RESTORE_NAME:-}" ]]; then
    docker rm -f "${RESTORE_NAME}" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
echo "==> Backup ${STAMP}"

compose exec -T postgres \
  sh -lc 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc --no-owner --no-acl' \
  > "${WORKDIR}/postgres.dump"

sig="$(head -c 5 "${WORKDIR}/postgres.dump" || true)"
if [[ "${sig}" != "PGDMP" ]]; then
  echo "ERROR: postgres dump is not a valid custom-format archive" >&2
  exit 1
fi

compose exec -T api tar -C /app/uploads -czf - . > "${WORKDIR}/uploads.tgz"
if ! gzip -t "${WORKDIR}/uploads.tgz"; then
  echo "ERROR: uploads archive is not valid gzip" >&2
  exit 1
fi

(
  cd "${WORKDIR}"
  sha256sum postgres.dump uploads.tgz > SHA256SUMS
)

ARCHIVE="${BACKUP_DIR}/dompettenang-${STAMP}.tar.gz"
tar -C "${WORKDIR}" -czf "${ARCHIVE}" postgres.dump uploads.tgz SHA256SUMS
chmod 600 "${ARCHIVE}"
ln -sfn "$(basename "${ARCHIVE}")" "${BACKUP_DIR}/LATEST"
printf '%s\n' "$(basename "${ARCHIVE}")" > "${BACKUP_DIR}/LATEST.name"
chmod 600 "${BACKUP_DIR}/LATEST.name"

find "${BACKUP_DIR}" -type f -name 'dompettenang-*.tar.gz' -mtime +"${RETENTION_DAYS}" -delete

bytes="$(wc -c < "${ARCHIVE}" | tr -d ' ')"
echo "backup ok archive=${ARCHIVE} bytes=${bytes}"

RCLONE_DEST="$(env_value BACKUP_RCLONE_DEST)"
if [[ -n "${RCLONE_DEST}" ]]; then
  if ! command -v rclone >/dev/null 2>&1; then
    echo "ERROR: BACKUP_RCLONE_DEST is set but rclone is not installed" >&2
    exit 1
  fi
  rclone copyto "${ARCHIVE}" "${RCLONE_DEST%/}/$(basename "${ARCHIVE}")"
  echo "offsite ok dest=${RCLONE_DEST}"
fi

if [[ "${RESTORE_TEST}" -ne 1 ]]; then
  exit 0
fi

echo "==> Restore test (throwaway database, production is not modified)"
(
  cd "${WORKDIR}"
  sha256sum -c SHA256SUMS
)

RESTORE_NAME="dt-restore-$(printf '%s' "${STAMP}" | tr 'TZ' 'tz')"
RESTORE_PASS="$(od -An -N16 -tx1 /dev/urandom | tr -d ' \n')"

docker run -d --name "${RESTORE_NAME}" --network none \
  -e "POSTGRES_PASSWORD=${RESTORE_PASS}" \
  -e POSTGRES_USER=restore \
  -e POSTGRES_DB=restore \
  postgres:16-alpine >/dev/null

ready=0
for _ in 1 2 3 4 5 6 7 8 9 10 11 12; do
  if docker exec -e "PGPASSWORD=${RESTORE_PASS}" "${RESTORE_NAME}" \
    pg_isready -U restore -d restore >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 2
done
if [[ "${ready}" -ne 1 ]]; then
  echo "ERROR: throwaway database did not become ready" >&2
  exit 1
fi

docker cp "${WORKDIR}/postgres.dump" "${RESTORE_NAME}:/tmp/postgres.dump"
# Empty cluster already has schema public; ignore the harmless "already exists" warning.
set +e
docker exec -e "PGPASSWORD=${RESTORE_PASS}" "${RESTORE_NAME}" \
  pg_restore -U restore -d restore --no-owner --no-acl --exit-on-error /tmp/postgres.dump
restore_status=$?
set -e
if [[ "${restore_status}" -gt 1 ]]; then
  echo "ERROR: pg_restore failed (${restore_status})" >&2
  exit 1
fi

count_sql() {
  local db="$1"
  if [[ "${db}" == "prod" ]]; then
    compose exec -T postgres \
      sh -lc "psql -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\" -tAc \"$2\""
  else
    docker exec -e "PGPASSWORD=${RESTORE_PASS}" "${RESTORE_NAME}" \
      psql -U restore -d restore -tAc "$2"
  fi
}

prod_users="$(count_sql prod 'SELECT COUNT(*) FROM users' | tr -d '[:space:]')"
test_users="$(count_sql test 'SELECT COUNT(*) FROM users' | tr -d '[:space:]')"
prod_expenses="$(count_sql prod 'SELECT COUNT(*) FROM expenses' | tr -d '[:space:]')"
test_expenses="$(count_sql test 'SELECT COUNT(*) FROM expenses' | tr -d '[:space:]')"

prod_files="$(compose exec -T api sh -lc 'find /app/uploads -type f | wc -l' | tr -d '[:space:]')"
test_files="$(tar -tzf "${WORKDIR}/uploads.tgz" | awk '!/\/$/ { n++ } END { print n+0 }' | tr -d '[:space:]')"

if [[ "${prod_users}" != "${test_users}" || "${prod_expenses}" != "${test_expenses}" || "${prod_files}" != "${test_files}" ]]; then
  echo "ERROR: restore counts differ users ${test_users}/${prod_users} expenses ${test_expenses}/${prod_expenses} files ${test_files}/${prod_files}" >&2
  exit 1
fi

echo "restore test ok users=${test_users} expenses=${test_expenses} upload_files=${test_files}"
