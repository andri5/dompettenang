#!/bin/sh
set -e

echo "[api] Waiting for database..."
# Prisma will retry; give Postgres a short head start when compose starts together
sleep 2

echo "[api] Syncing schema (prisma db push)..."
npx prisma db push --skip-generate

echo "[api] Starting Dompet Tenang API..."
exec node dist/index.js
