.PHONY: install dev build preview test test-watch coverage lint lint-fix fmt fmt-check type-check clean

# ── Dependencies ──────────────────────────────────────────────────────────────
install:
	npm install

# ── Development ───────────────────────────────────────────────────────────────
dev:
	npm run dev

dev-web:
	npm run dev:web

dev-api:
	npm run dev:api

# ── Build ─────────────────────────────────────────────────────────────────────
build:
	npm run build

preview:
	npm run preview

# ── Quality ───────────────────────────────────────────────────────────────────
type-check:
	npm run type-check

lint:
	npm run lint

lint-fix:
	npm run lint:fix

fmt:
	npm run fmt

fmt-check:
	npm run fmt:check

# ── Tests ─────────────────────────────────────────────────────────────────────
test:
	npm test

test-watch:
	npm run test:watch

coverage:
	npm run test:coverage

# ── Cleanup ───────────────────────────────────────────────────────────────────
clean:
	rm -rf dist node_modules

# ── All checks (mirrors CI) ───────────────────────────────────────────────────
ci: type-check lint fmt-check test build
