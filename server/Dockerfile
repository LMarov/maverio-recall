# Debian-based (not Alpine): @picovoice/eagle-node ships a glibc-linked
# native binary, which won't load against musl.
FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
# migrate.ts resolves migrations relative to its own compiled location
# (dist/db/migrations) — the .sql files aren't picked up by tsc, so copy them
# in directly. Migrations are run as a one-off command (see README), not on
# every boot.
COPY src/db/migrations ./dist/db/migrations

EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD node -e "require('http').get('http://localhost:'+(process.env.PORT||8787)+'/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "dist/index.js"]
