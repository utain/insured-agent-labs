# InsureAgentLabs — developer & deployment workflow.
# Run `make help` for the full target list.

SHELL := /bin/bash
.DEFAULT_GOAL := help

# Where the e2e suite points (override on the CLI, e.g. `make e2e BASE_URL=...`).
BASE_URL ?= http://localhost:5173
export BASE_URL

## --- Native development (no Docker) -------------------------------------------

.PHONY: dev
dev: ## Run the app natively (pnpm dev) on :5173
	cd web && pnpm install && pnpm dev

.PHONY: test
test: ## Run web unit tests (vitest) + svelte-check
	cd web && pnpm install && pnpm check && pnpm test:unit -- --run

## --- Docker (single app) ------------------------------------------------------

.PHONY: build
build: ## Build the web image
	docker compose build

.PHONY: up
up: ## Start the app, wait for healthy
	docker compose up --build -d
	@echo "app → http://localhost:$${WEB_PORT:-5173}  (Swagger: /api-docs)"

.PHONY: up-fg
up-fg: ## Start the app in the foreground (streams logs)
	docker compose up --build

.PHONY: down
down: ## Stop and remove the app
	docker compose down

.PHONY: logs
logs: ## Tail app logs
	docker compose logs -f

.PHONY: reset
reset: ## Reset in-memory state to the seed baseline
	curl -fsS -X POST "$(BASE_URL)/api/admin/reset" -o /dev/null -w "reset → %{http_code}\n"

## --- End-to-end / API blackbox tests ------------------------------------------

.PHONY: e2e-install
e2e-install: ## Install e2e deps + Playwright browsers
	cd e2e && pnpm install && pnpm exec playwright install --with-deps chromium

.PHONY: e2e
e2e: ## Run the full blackbox suite (API + UI) against a running app
	cd e2e && pnpm install && pnpm test

.PHONY: e2e-api
e2e-api: ## Run only the API blackbox tests
	cd e2e && pnpm install && pnpm test:api

.PHONY: e2e-ui
e2e-ui: ## Run only the UI (e2e) tests
	cd e2e && pnpm install && pnpm test:ui

.PHONY: e2e-report
e2e-report: ## Open the last Playwright HTML report
	cd e2e && pnpm exec playwright show-report

.PHONY: stack-e2e
stack-e2e: ## Bring the app up, run the full blackbox suite, then tear down
	$(MAKE) up
	$(MAKE) e2e || (code=$$?; $(MAKE) down; exit $$code)
	$(MAKE) down

.PHONY: help
help: ## Show this help
	@grep -hE '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'
