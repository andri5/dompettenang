# Dompet Tenang API — production image
# Use Debian slim (not Alpine) so Prisma OpenSSL engines work reliably.
FROM node:20-bookworm-slim AS builder

WORKDIR /app

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json ./
COPY prisma ./prisma/
RUN npm install

COPY tsconfig.json ./
COPY src ./src/
RUN npx prisma generate && npm run build

# Keep prisma CLI for db push on start
RUN npm install prisma@5.22.0 --save-exact

FROM node:20-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system app \
  && useradd --system --gid app --create-home app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x ./docker-entrypoint.sh \
  && mkdir -p /app/uploads/avatars /app/uploads/receipts \
  && chown -R app:app /app

# Start as root so entrypoint can chown the uploads volume, then drop to `app`.
USER root
EXPOSE 3001

ENTRYPOINT ["./docker-entrypoint.sh"]
