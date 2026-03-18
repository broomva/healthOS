# healthOS Makefile — Control Metalayer Sensors
# Referenced by CONTROL.md setpoints and Symphony hooks

.PHONY: all smoke typecheck lint build test secrets-check bundle-check dev clean

# === Composite Targets ===

all: smoke test

# Fast gate — must pass before every commit
smoke: typecheck lint build
	@echo "--- SMOKE PASSED ---"

# === Individual Sensors ===

# S1: TypeScript compiles cleanly
typecheck:
	@echo "[S1] Typechecking..."
	bunx tsc --noEmit

# S2: Biome lint passes
lint:
	@echo "[S2] Linting..."
	bunx biome check .

# S3: E2E tests pass (full suite — use for PR gate)
test:
	@echo "[S3] Running tests..."
	bunx playwright test

# S4: Build succeeds
build:
	@echo "[S4] Building..."
	bun run build

# S5: No secrets in codebase
secrets-check:
	@echo "[S5] Checking for secrets..."
	@! grep -rn --include='*.ts' --include='*.tsx' --include='*.js' --include='*.json' \
		-E '(sk-[a-zA-Z0-9]{20,}|AKIA[A-Z0-9]{16}|ghp_[a-zA-Z0-9]{36}|lin_api_[a-zA-Z0-9]+)' \
		--exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git . \
		|| (echo "SECRETS DETECTED — aborting" && exit 1)
	@echo "No secrets found."

# S6: Bundle size check
bundle-check: build
	@echo "[S6] Checking bundle size..."
	@ls -la .next/static/chunks/*.js 2>/dev/null | head -20
	@echo "Manual review: check First Load JS < 500KB in build output"

# === Dev Targets ===

dev:
	bun dev --turbo

# Database
db-migrate:
	bun db:migrate

db-studio:
	bunx drizzle-kit studio

# Cleanup
clean:
	rm -rf .next node_modules/.cache

# === Symphony Integration ===

# Quick validation for Symphony hooks
validate: typecheck lint
	@echo "--- VALIDATE PASSED ---"
