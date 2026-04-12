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
- `src/tests/fixtures/auth.setup.ts` — Auth setup
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

## Workspace Hygiene

`playwright/trash/` is the designated temp directory for browser data offloading (snapshots, evaluates, network captures). Files there overwrite each other by design and are gitignored.

Agents must NEVER create temporary files anywhere else in the project tree:
- No scratch files in project root, `.ouroboros/`, `src/docs/`, or anywhere outside `playwright/trash/`
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
