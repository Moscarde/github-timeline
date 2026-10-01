FROM node:22-bookworm-slim AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

FROM node:22-bookworm-slim

ENV NODE_ENV=production \
    PORT=3000 \
    DATABASE_PATH=/app/storage/timeline.db

WORKDIR /app
RUN mkdir -p /app/storage && chown node:node /app/storage
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node public ./public
COPY --chown=node:node data/curated.json ./data/curated.json

USER node
EXPOSE 3000
VOLUME ["/app/storage"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + process.env.PORT + '/healthz').then(r => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))"
CMD ["node", "dist/server.js"]
