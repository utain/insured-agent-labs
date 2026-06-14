# syntax=docker/dockerfile:1

# ===== Stage 1: build =====
FROM node:22-slim AS builder

WORKDIR /app

# pnpm via corepack (the project ships a pnpm-lock.yaml).
RUN corepack enable

# Install dependencies first for better layer caching.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Build the SvelteKit app (adapter-node → ./build) and generate Paraglide output.
COPY . .
RUN pnpm build

# ===== Stage 2: runtime =====
FROM node:22-slim AS runtime

RUN useradd --create-home --uid 10001 app
WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    RUST_API_URL=http://backend:3000 \
    # Public origin for adapter-node CSRF validation of form POSTs.
    # Override per deployment to match the browser-facing URL.
    ORIGIN=http://localhost:5173

# adapter-node output + the (full) node_modules so any externalized runtime
# deps resolve. Image size is not a concern for this training fixture.
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER app
EXPOSE 3000

# node:slim has no curl/wget; use Node's global fetch for the healthcheck.
# `/` 302-redirects to /login (200) for an anonymous request.
HEALTHCHECK --interval=10s --timeout=3s --retries=12 --start-period=10s \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||3000)+'/login').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "build"]
