---
name: setup-tests
description: "Orchestrates the test-architect agent to create Playwright test infrastructure from verified specs"
agents:
  - test-architect
---

# Setup Tests Workflow

## Purpose
Analyze verified specs, create production-ready Playwright test project with proper architecture.

## Prerequisites
- At least one page with verified specs
- Node.js available

## Arguments
- `--force` (optional): Overwrite existing test infrastructure

## Process

<step name="initialize_project" priority="first">
1. Read `.ouroboros/config.json` for domain info
2. Check if `src/tests/` exists
3. If exists and no `--force`: skip to architecture update
4. If not exists or `--force`:
   - Run `npm init -y` if no package.json
   - Run `npm install -D @playwright/test typescript @typescript-eslint/eslint-plugin`
   - Run `npx playwright install chromium`
   - Create `tsconfig.json`
</step>

<step name="analyze_domain">
1. Read `.ouroboros/testing-scope.md` — scope controls what infrastructure to build
2. Read all verified specs from `src/docs/`
3. Read `src/docs/DOMAIN-TREE.md`
3. Read source in `src/` — understand base classes, components, fixtures, helpers
4. Identify common UI patterns across pages:
   - Shared components (tables, forms, modals, navigation)
   - Common data types (entities, relationships)
   - Authentication requirements (roles, permissions)
   - API patterns (REST endpoints, GraphQL queries)
5. Create `.ouroboros/test-map.json` with spec-to-test mapping
</step>

<step name="generate_infrastructure">
Spawn test-architect agent to create domain-specific files in `src/`:

1. `src/tests/playwright.config.ts` — projects for auth setup + browsers
2. `src/fixtures/test.fixture.ts` — domain fixture extending `src/fixtures/base.fixture.ts`
3. `src/tests/fixtures/auth.setup.ts` — Playwright setup test using `test as setup` API
4. `src/pages/{module}/{page}.page.ts` — per documented page (extending `src/base/page.ts`)
5. `src/helpers/data-factory.ts` — data factory (base + domain generators)
6. `src/helpers/constants.ts` — all constants (framework + domain)

**DO NOT recreate or modify files in `src/base/`, `src/components/`, or `src/utils/` — generic framework.**
</step>

<step name="validate_architecture">
1. TypeScript check: `npx tsc --noEmit`
2. Fix type errors
3. Verify page objects compile, fixtures properly typed
4. **Run architecture validation:**
   ```bash
   node scripts/validate-architecture.mjs
   ```
   Checks: every spec recipe has POM method, API contracts match helpers, URL paths match constants, fixture chains intact. Fix failures before proceeding.
5. **Verify API contracts against live endpoints:**
   ```bash
   node scripts/api-probe.mjs verify-contract --all --json
   ```
   Reads spec files, extracts API Contract tables, probes each endpoint. Fix mismatches.
</step>

<step name="smoke_test" priority="critical">
**Clean compile does NOT guarantee runtime correctness.** Run smoke test:

```bash
node scripts/api-probe.mjs smoke /api/v1/{first-resource-from-spec} --json
```

Three checks:
1. **Auth** — authenticates (or verifies storageState), discovers token mechanism
2. **API probe** — one authenticated GET, verifies 200 with correct auth
3. **Navigation** — loads app in browser with storageState, verifies no login redirect

| Check | `data.*.status` | Action |
|-------|----------------|--------|
| auth | `fail` | Fix login flow, credentials, or auth setup |
| apiProbe | `fail` | Fix API helper auth — `httpStatus` shows 401/403 (auth) or 404 (endpoint) |
| navigation | `fail` | Fix storageState path, base URL, or auth mechanism |

**If ANY check fails, DO NOT proceed to manifest generation.** Fix root cause first.

For targeted debugging:
```bash
node scripts/api-probe.mjs extract-auth --json
node scripts/api-probe.mjs probe GET /api/v1/{resource} --json
node scripts/api-probe.mjs probe POST /api/v1/{resource} --data '{"field":"value"}' --json
```
</step>

<step name="verify_no_dead_code">
**Every created file must be used by test-writer:**
1. Every `src/components/` component imported by at least one POM or fixture
2. Every `src/helpers/` helper importable with clear consumer
3. BasePage methods must work with app's UI framework (check verified specs)
4. DataFactory must generate data passing ALL validation rules in specs (not just "required")
5. `src/utils/config.ts` MUST be ONLY place reading `.ouroboros/config.json`

If component/helper not needed by any POM or spec, DO NOT create it.
</step>

<step name="generate_manifest">
Create `.ouroboros/architect-manifest.md` documenting:

1. **Files created** — every file path with one-line description
2. **Fixtures available** — name, type, what it provides
   ```
   | Fixture | Import From | Type | Description |
   |---------|------------|------|-------------|
   | {page}Page | fixtures/base.fixture | test-scoped | {DomainPage} pre-navigated |
   | dataManager | fixtures/data.fixture | test-scoped | Tracks and auto-cleans test entities |
   ```
3. **POM public API** — every public method on each page object writer should use
   ```
   | Method | Page Object | Description |
   |--------|------------|-------------|
   | openCreate{Entity}Modal() | {DomainPage} | Opens create form, waits for visible |
   | create{Entity}Modal.fill(data) | {EntityFormModal} | Fills all form fields from {Entity}Data |
   ```
4. **Anti-patterns** — what writer must NOT do
   ```
   - NEVER use raw `page.locator()` in spec files — use POM methods
   - NEVER hardcode API URLs — use DataManager fixture for cleanup
   - NEVER add `scrollIntoViewIfNeeded()` in specs — POM methods handle this
   - NEVER define standalone helper functions for form filling — use POM's fill()
   ```
5. **Import cheat sheet** — copy-paste imports for writer
   ```typescript
   import { test, expect } from '../../../fixtures/test.fixture';
   import { DataFactory } from '../../../helpers/data-factory';
   import { VALIDATION, SUCCESS_MESSAGES } from '../../../helpers/constants';
   ```
</step>

This manifest is the binding contract between architect and writer.
</step>

<step name="update_state">
1. Update `src/docs/STATE.md` with architecture status
2. Report: files created, patterns detected, components generated
3. Suggest: `/tc:write-tests {page-slug}` for each verified page
</step>
