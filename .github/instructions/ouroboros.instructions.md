# Ouroboros Tester Instructions

You are working in the Ouroboros Tester project — an AI-driven domain test automation system that uses Playwright MCP to explore, understand, and write tests for web applications.

## Available Commands

| Command | Purpose |
|---------|---------|
| `/orb-init <url>` | Initialize project for a domain |
| `/orb-explore <url> --name "<name>"` | Explore a page and document sections |
| `/orb-verify <page-slug>` | Verify spec accuracy for a page |
| `/orb-architect` | Set up Playwright test infrastructure |
| `/orb-write-tests <page-slug>` | Write tests from verified specs |
| `/orb-status` | Show progress dashboard |
| `/orb-run <url> --name "<name>"` | Full pipeline for a page |

## Key Files

- `.ouroboros/config.json` — Project configuration
- `.ouroboros/testing-scope.md` — User-defined testing scope (what to test / what not to test)
- `src/docs/STATE.md` — Progress tracking
- `src/docs/DOMAIN-TREE.md` — Cross-page entity relationships
- `src/docs/` — Page and section specs (`spec.md` for scenarios, `impl.md` for technical details)
- `src/base/` — BasePage class
- `src/components/` — Generic UI components
- `src/fixtures/` — Fixtures (base + domain test.fixture)
- `src/helpers/` — Constants, data-factory, API helper, assertions
- `src/utils/config.ts` — Config loader (.ouroboros/)
- `src/pages/` — Domain page objects (POMs)
- `templates/` — Scaffolding templates for specs and config
- `src/tests/` — Playwright test cases only
- `src/tests/fixtures/auth.setup.ts` — Auth setup test (Playwright setup project)
- `src/tests/playwright.config.ts` — Playwright config with auth setup project → chromium dependency
- `src/tests/{module}/{page}/{section}.spec.ts` — Test files
- `scripts/api-probe.mjs` — Auth, API probing, network capture, ad-hoc browser execution
- `scripts/validate-spec.mjs` — Spec completeness validation (quality gate for explorer/verifier)
- `scripts/validate-architecture.mjs` — Architecture validation (quality gate for architect)

## File Structure Convention

Commands are thin wrappers — all logic lives in shared files:

| Path | Purpose | Used By |
|------|---------|---------|
| `.github/workflows/*.md` | Workflow steps — **source of truth** | Claude + Copilot |
| `.github/agents/*.md` | Agent protocols — **source of truth** | Claude + Copilot |
| `.claude/commands/orb-*.md` | Claude Code slash commands | Claude Code only |
| `.github/prompts/orb-*.prompt.md` | Copilot slash commands | GitHub Copilot only |

**To update a command**: edit only the workflow/agent file in `.github/`. Both Claude and Copilot commands reference the same shared files — never duplicate workflow logic into command files.

## Testing Scope Protocol

Read `.ouroboros/testing-scope.md` before ANY agent work. Scope is a hard constraint, not a suggestion.

- **"What to test" has entries:** Only explore/verify/test listed operations. Everything else is invisible — don't touch it.
- **"What not to test" has entries:** Never explore, trigger, document, or test listed items. Not even as part of another operation.
- **Both empty or file missing:** Default behavior — process everything.
- **Both have entries:** "What to test" narrows scope; "What not to test" removes items from that scope.

**Feedback signals (toasts, banners, alerts):** Part of a scoped operation's assertion — not standalone test cases or standalone spec scenarios.

**Test infrastructure vs test subject:** Scope exclusions apply to what agents ASSERT/TEST, not to infrastructure that supports testing. API helpers, auth, and cleanup utilities are always built regardless of scope.

## Operational Safety

These rules are **non-negotiable**. No agent may override, work around, or "temporarily" suspend them regardless of task complexity, test failures, or time pressure.

### Destructive Action Prevention

**NEVER** execute mass mutations against the target application:
- No bulk DELETE operations (looping over records to delete them)
- No bulk UPDATE operations that modify records not created by the current test run
- No operations that affect ALL records in a collection, table, or category
- No "cleanup" scripts that search-and-destroy matching records

**NEVER** delete records that were not created by the current agent session. Pre-existing application data is untouchable — even if it looks like leftover test data, even if names match test patterns, even if it "should" have been cleaned up.

**NEVER** delete, disable, or modify user accounts, roles, or permissions in the target application. Authentication credentials and access control are infrastructure. Destroying them locks everyone out — including the agent.

**Single-item test data lifecycle** is the ONLY permitted mutation pattern:
1. **Create** one record via API or UI (for test purposes)
2. **Use** that record in the test
3. **Delete** that specific record via DataManager fixture or test teardown
4. Track every created record with `dataManager.track()` for guaranteed cleanup

If test data accumulates beyond what DataManager handles → **report to user**. Do not attempt automated mass cleanup.

### Script & File Creation Boundaries

**NEVER** create standalone scripts (.js, .mjs, .ts, .sh, .py) for ad-hoc operations — not in `/tmp`, not in the project root, not anywhere. Ad-hoc scripts bypass all framework safety mechanisms (DataManager, fixtures, tracked cleanup) and cannot be audited or rolled back.

**NEVER** use `child_process`, `execSync`, `exec`, shell pipelines, `node -e`, or `node <<EOF` to build ad-hoc operations. If it doesn't exist as a project script in `scripts/` or as a test in `src/tests/`, it should not be executed.

**NEVER** run loops in terminal that make API calls. A `for`/`while` loop calling `api-probe` or making HTTP requests is a mass mutation — regardless of intent.

**NEVER** make direct HTTP requests (`curl`, `wget`, `fetch`, `axios`) outside the test framework. All API interaction goes through:
- `scripts/api-probe.mjs` — for single read/probe operations during exploration and diagnosis
- `src/helpers/api.helper.ts` — for test data setup within the Playwright fixture lifecycle
- DataManager — for tracked cleanup

Each agent defines a **Terminal Usage** whitelist of permitted commands. Commands not on the whitelist require user approval.

### Escalation Protocol

When encountering situations outside normal test operations, **STOP and report to user**:

| Situation | Action |
|-----------|--------|
| Leftover test data from previous runs | Report. Do not auto-clean. |
| Test environment in unexpected state | Document. Do not "fix" by deleting data. |
| Need to modify data not created by current run | Ask user for explicit approval. |
| Authentication/session issues | Re-authenticate via `api-probe auth`. Do not modify user records. |
| Test blocked by missing data | Create minimal test data via DataManager. Do not harvest existing data. |
| Agent needs capability outside its tool set | Report limitation. Do not improvise workarounds. |

The test of any action: **"If this goes wrong, can it be undone without human intervention?"** If no → do not proceed without user approval.

## Workspace Hygiene

`playwright/trash/` is the designated temp directory for browser data offloading (snapshots, evaluates, network captures). Files there overwrite each other by design and are gitignored.

Agents must NEVER create files outside the project workspace. No `/tmp`, no home directory, no external paths.

Agents must NEVER create temporary files anywhere else in the project tree:
- No scratch files in project root, `.ouroboros/`, `src/docs/`, or anywhere outside `playwright/trash/`
- No standalone scripts anywhere — not in `playwright/trash/`, not in project root, not in `/tmp`
- Only write permanent files to: `src/docs/` (specs), `src/pages/` (POMs), `src/tests/` (tests), `src/fixtures/`, `src/helpers/`, and state files (`STATE.md`, `DOMAIN-TREE.md`)

## Conventions

1. **Specs use Given/When/Then scenarios** — Every requirement has testable scenarios
2. **Cross-page relationships are tracked** — Entities flow between pages is documented
3. **Goal-backward verification** — Verify "can users do X?" not "did agent write Y?"
4. **POM pattern** — Page objects encapsulate interactions; components for reusable UI
5. **Fixtures over hooks** — Use Playwright fixtures for setup/teardown
6. **User-facing locators** — getByRole, getByLabel, getByText over CSS selectors
7. **File-based state** — All progress tracked in markdown files, no database
8. **URL-based folders** — Page/test folders mirror URL path hierarchy (e.g., `/CategoryName/SubPage` → `category-name/sub-page/`). Query-param tabs (`?tab=X`) become sections within the page folder, not separate pages.
9. **Everything in src/** — All infrastructure, POMs, specs, helpers live in `src/`; `src/tests/` contains only `.spec.ts` files
