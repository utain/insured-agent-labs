# syntax=docker/dockerfile:1

# ===== Stage 1: build =====
# Rust edition 2024 requires rustc >= 1.85; the `1-slim` tag tracks the latest
# stable toolchain.
FROM rust:1-slim-bookworm AS builder

WORKDIR /app

# Build tooling: `curl` is REQUIRED — utoipa-swagger-ui's build script downloads
# the Swagger UI assets via curl at compile time. pkg-config is cheap insurance.
RUN apt-get update \
 && apt-get install -y --no-install-recommends pkg-config curl \
 && rm -rf /var/lib/apt/lists/*

# Copy the full crate and build the release binary.
# (For faster incremental CI builds, swap this for a cargo-chef recipe; kept
# straightforward here so the image builds reproducibly from a clean checkout.)
COPY . .
RUN cargo build --release --bin backend

# ===== Stage 2: runtime =====
FROM debian:bookworm-slim AS runtime

# curl is used by the container HEALTHCHECK / compose healthcheck.
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl \
 && rm -rf /var/lib/apt/lists/* \
 && useradd --create-home --uid 10001 app

WORKDIR /app
COPY --from=builder /app/target/release/backend /usr/local/bin/backend

USER app

ENV RUST_LOG=info \
    PORT=3000 \
    ADMIN_SECRET=dev-admin-secret \
    CORS_ORIGIN=http://localhost:5173

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --retries=12 --start-period=10s \
  CMD curl -fsS "http://localhost:${PORT}/api/health" || exit 1

CMD ["backend"]
