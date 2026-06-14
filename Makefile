# InsureAgentLabs — developer & deployment workflow.
# Run `make help` for the full target list.

SHELL := /bin/bash
.DEFAULT_GOAL := help

# Where the e2e suite points (override on the CLI, e.g. `make e2e WEB_BASE_URL=...`).
API_BASE_URL ?= http://localhost:3000
WEB_BASE_URL ?= http://localhost:5173
export API_BASE_URL WEB_BASE_URL

## --- Native development (no Docker) -------------------------------------------

.PHONY: dev-backend
dev-backend: ## Run the backend natively (cargo run) on :3000
	cd backend && cp -n .env.example .env || true; cargo run

.PHONY: dev-web
dev-web: ## Run the web app natively (pnpm dev) on :5173
	cd web && cp -n .env.example .env || true; pnpm install && pnpm dev

.PHONY: test-backend
test-backend: ## Run backend unit tests + clippy
	cd backend && cargo clippy -- -D warnings && cargo test

.PHONY: test-web
test-web: ## Run web unit/component tests (vitest)
	cd web && pnpm install && pnpm test:unit -- --run

## --- Docker Compose (full stack) ----------------------------------------------

.PHONY: build
build: ## Build backend + web images
	docker compose build

.PHONY: up
up: ## Start the full stack (backend + web), wait for healthy
	docker compose up --build -d
	@echo "web      → http://localhost:$${WEB_PORT:-5173}"
	@echo "backend  → http://localhost:$${BACKEND_PORT:-3000}  (Swagger: /api-docs)"

.PHONY: up-fg
up-fg: ## Start the full stack in the foreground (streams logs)
	docker compose up --build

.PHONY: down
down: ## Stop and remove the stack
	docker compose down

.PHONY: logs
logs: ## Tail stack logs
	docker compose logs -f

.PHONY: ps
ps: ## Show stack status
	docker compose ps

.PHONY: reset
reset: ## Reset backend in-memory state to seed (via agent.standard session)
	@token=$$(curl -fsS -X POST "$(API_BASE_URL)/api/auth/login" \
		-H 'Content-Type: application/json' \
		-d '{"username":"agent.standard","password":"insure_demo"}' \
		| sed -n 's/.*"token":"\([^"]*\)".*/\1/p'); \
	curl -fsS -X POST "$(API_BASE_URL)/api/admin/reset" \
		-H "Authorization: Bearer $$token" -o /dev/null -w "reset → %{http_code}\n"

## --- End-to-end / API blackbox tests ------------------------------------------

.PHONY: e2e-install
e2e-install: ## Install e2e deps + Playwright browsers
	cd e2e && pnpm install && pnpm exec playwright install --with-deps chromium

.PHONY: e2e
e2e: ## Run the full blackbox suite (API + UI) against running services
	cd e2e && pnpm install && pnpm test

.PHONY: e2e-api
e2e-api: ## Run only the API (integration) blackbox tests
	cd e2e && pnpm install && pnpm test:api

.PHONY: e2e-ui
e2e-ui: ## Run only the UI (e2e) tests
	cd e2e && pnpm install && pnpm test:ui

.PHONY: e2e-report
e2e-report: ## Open the last Playwright HTML report
	cd e2e && pnpm exec playwright show-report

## --- Convenience --------------------------------------------------------------

.PHONY: stack-e2e
stack-e2e: ## Bring the stack up, run the full blackbox suite, then tear down
	$(MAKE) up
	$(MAKE) e2e || (code=$$?; $(MAKE) down; exit $$code)
	$(MAKE) down

.PHONY: help
help: ## Show this help
	@grep -hE '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'
