#!/bin/sh
set -e

# Named volume /app/uploads is often root-owned on first mount.
# Entrypoint runs as root, fixes perms, then drops to user `app`.
mkdir -p /app/uploads/avatars /app/uploads/receipts /app/uploads/proofs
chown -R app:app /app/uploads
chmod -R u+rwX /app/uploads

echo "[api] Waiting for database..."
sleep 2

echo "[api] Syncing schema (prisma db push)..."
runuser -u app -- env HOME=/home/app npx prisma db push --skip-generate

echo "[api] Starting Dompet Tenang API..."
exec runuser -u app -- env HOME=/home/app node dist/index.js
