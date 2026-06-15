# syntax=docker/dockerfile:1

# ===== Stage 1: build =====
FROM node:22-slim AS builder

WORKDIR /app

# pnpm via corepack (the project ships a pnpm-lock.yaml).
RUN corepack enable

# Install dependencies first for better layer caching.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Build the SvelteKit app (adapter-node → ./build).
COPY . .
RUN pnpm build

# ===== Stage 2: runtime (hardened node:slim) =====
FROM node:22-slim AS runtime

# tini → proper PID 1: forwards SIGTERM/SIGINT to node (graceful shutdown in
# Kubernetes/Compose) and reaps zombies. nologin shell hardens the run user.
RUN apt-get update \
 && apt-get install -y --no-install-recommends tini \
 && rm -rf /var/lib/apt/lists/* \
 && useradd --create-home --uid 10001 --shell /usr/sbin/nologin app

WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    # Public origin for adapter-node CSRF validation of form POSTs.
    # Override per deployment to match the browser-facing URL.
    ORIGIN=http://localhost:5173

# adapter-node bundles everything into ./build — the project declares no runtime
# `dependencies` (the build imports only node: builtins), so node_modules is
# dropped entirely. package.json is kept solely for its `"type": "module"`, which
# tells Node to load build/*.js as ESM. Files stay root-owned (app can read, not
# write) for a read-only-filesystem-friendly image.
COPY --from=builder --chown=root:root /app/build ./build
COPY --from=builder --chown=root:root /app/package.json ./package.json

USER app
EXPOSE 3000

# node:slim has no curl/wget; use Node's global fetch for the healthcheck.
# `/` 302-redirects to /login (200) for an anonymous request.
HEALTHCHECK --interval=10s --timeout=3s --retries=12 --start-period=10s \
  CMD ["node", "-e", "fetch('http://localhost:'+(process.env.PORT||3000)+'/login').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

# tini as PID 1, then the server.
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "build"]
