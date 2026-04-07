---
name: setup-tests
description: "Orchestrates the test-architect agent to create Playwright test infrastructure from verified specs"
agents:
  - test-architect
---

# Setup Tests Workflow

## Purpose
Analyze all verified specs and create a production-ready Playwright test project with proper architecture.

## Prerequisites
- At least one page must have verified specs
- Node.js must be available

## Arguments
- `--force` (optional): Overwrite existing test infrastructure

## Process

<step name="initialize_project" priority="first">
1. Read `.ouroboros/config.json` for domain info
2. Check if `src/tests/` directory exists
3. If exists and no `--force`: skip to architecture update
4. If not exists or `--force`:
   - Run `npm init -y` in project root if no package.json
   - Run `npm install -D @playwright/test typescript @typescript-eslint/eslint-plugin`
   - Run `npx playwright install chromium`
   - Create `tsconfig.json` for test project
</step>

<step name="analyze_domain">
1. Read all verified specs from `src/docs/`
2. Read `src/docs/DOMAIN-TREE.md`
3. Read the source in `src/` — understand available base classes, components, fixtures, helpers
4. Identify common UI patterns across all pages:
   - Shared components (tables, forms, modals, navigation)
   - Common data types (entities, relationships)
   - Authentication requirements (roles, permissions)
   - API patterns (REST endpoints, GraphQL queries)
5. Create `.ouroboros/test-map.json` with spec-to-test mapping
</step>

<step name="generate_infrastructure">
Spawn test-architect agent to create domain-specific files in `src/`:

1. `src/tests/playwright.config.ts` — with projects for auth setup + browsers
2. `src/fixtures/test.fixture.ts` — domain fixture extending `src/fixtures/base.fixture.ts`
3. `src/tests/fixtures/auth.setup.ts` — authentication using `src/fixtures/auth.setup.ts`
4. `src/pages/{module}/{page}.page.ts` — for each documented page (extending `src/base/page.ts`)
5. `src/helpers/data-factory.ts` — data factory (base + domain generators)
6. `src/helpers/constants.ts` — all constants (framework + domain)

**DO NOT recreate or modify files in `src/base/`, `src/components/`, or `src/utils/` — these are the generic framework.**
</step>

<step name="validate_architecture">
1. Run TypeScript compiler: `npx tsc --noEmit`
2. Fix any type errors
3. Verify all page objects compile
4. Verify fixtures are properly typed
5. **Run architecture validation script:**
   ```bash
   node scripts/validate-architecture.mjs
   ```
   This checks: every spec recipe has a POM method, API contracts match helpers, URL paths match constants, fixture chains are intact. Fix any failures before proceeding.
6. **Verify API contracts against live endpoints:**
   ```bash
   node scripts/api-probe.mjs verify-contract --all --json
   ```
   This reads all spec files, extracts API Contract tables, and probes each endpoint. Fix mismatches in the spec or helpers.
</step>

<step name="smoke_test" priority="critical">
**A clean compile does NOT guarantee runtime correctness.** Run the smoke test script to verify the architecture works at runtime:

```bash
node scripts/api-probe.mjs smoke /api/v1/{first-resource-from-spec} --json
```

This runs three checks automatically:
1. **Auth** — authenticates (or verifies existing storageState), discovers token mechanism
2. **API probe** — makes one authenticated GET request, verifies 200 response with correct auth propagation
3. **Navigation** — loads the app in a browser with storageState, verifies no redirect to login

Parse the JSON result and check each status:

| Check | `data.*.status` | Action |
|-------|----------------|--------|
| auth | `fail` | Fix login flow, credentials in `.ouroboros/config.json`, or auth setup |
| apiProbe | `fail` | Fix API helper auth propagation — the `data.apiProbe.httpStatus` shows if it's 401/403 (auth wrong) or 404 (endpoint wrong) |
| navigation | `fail` | Fix storageState path, base URL, or auth mechanism |

**If ANY check fails, DO NOT proceed to manifest generation.** Fix the root cause in the architecture files first.

For targeted debugging, use individual commands:
```bash
# Check auth details
node scripts/api-probe.mjs extract-auth --json

# Probe a specific endpoint
node scripts/api-probe.mjs probe GET /api/v1/{resource} --json

# Probe with payload
node scripts/api-probe.mjs probe POST /api/v1/{resource} --data '{"field":"value"}' --json
```
</step>

<step name="verify_no_dead_code">
**Ensure every created file will be used by the test-writer:**
1. Every component in `src/components/` MUST be imported by at least one page object or fixture
2. Every helper in `src/helpers/` MUST be importable and have a clear consumer
3. BasePage MUST NOT contain methods that don't work with the app's UI framework (check verified specs for framework details)
4. DataFactory MUST generate data that passes ALL validation rules in specs (not just "required")
5. `src/utils/config.ts` MUST be the ONLY place that reads `.ouroboros/config.json` — all other files import from config.ts

If a component/helper is not needed by any page object or spec, DO NOT create it.
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
3. **POM public API** — every public method on each page object that the writer should use
   ```
   | Method | Page Object | Description |
   |--------|------------|-------------|
   | openCreate{Entity}Modal() | {DomainPage} | Opens create form, waits for visible |
   | create{Entity}Modal.fill(data) | {EntityFormModal} | Fills all form fields from {Entity}Data |
   ```
4. **Anti-patterns** — what the writer must NOT do
   ```
   - NEVER use raw `page.locator()` in spec files — use POM methods
   - NEVER hardcode API URLs — use DataManager fixture for cleanup
   - NEVER add `scrollIntoViewIfNeeded()` in specs — POM methods handle this
   - NEVER define standalone helper functions for form filling — use POM's fill()
   ```
5. **Import cheat sheet** — copy-paste imports the writer should use
   ```typescript
   import { test, expect } from '../../../fixtures/test.fixture';
   import { DataFactory } from '../../../helpers/data-factory';
   import { VALIDATION, SUCCESS_MESSAGES } from '../../../helpers/constants';
   ```

This manifest is the binding contract between architect and writer.
</step>

<step name="update_state">
1. Update `src/docs/STATE.md` with architecture status
2. Report: files created, patterns detected, components generated
3. Suggest: `/tc:write-tests {page-slug}` for each verified page
</step>
