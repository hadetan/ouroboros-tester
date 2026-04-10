# Ouroboros Tester Instructions

You are working in the Ouroboros Tester project — an AI-driven domain test automation system that uses Playwright MCP to explore, understand, and write tests for web applications.

## Available Commands

| Command | Purpose |
|---------|---------|
| `/tc-init <url>` | Initialize project for a domain |
| `/tc-explore <url> --name "<name>"` | Explore a page and document sections |
| `/tc-verify <page-slug>` | Verify spec accuracy for a page |
| `/tc-architect` | Set up Playwright test infrastructure |
| `/tc-write-tests <page-slug>` | Write tests from verified specs |
| `/tc-status` | Show progress dashboard |
| `/tc-run <url> --name "<name>"` | Full pipeline for a page |

## Key Files

- `.ouroboros/config.json` — Project configuration
- `src/docs/STATE.md` — Progress tracking
- `src/docs/DOMAIN-TREE.md` — Cross-page entity relationships
- `src/docs/` — Page and section specs (domain requirement docs)
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
| `.claude/commands/tc-*.md` | Claude Code slash commands | Claude Code only |
| `.github/prompts/tc-*.prompt.md` | Copilot slash commands | GitHub Copilot only |

**To update a command**: edit only the workflow/agent file in `.github/`. Both Claude and Copilot commands reference the same shared files — never duplicate workflow logic into command files.

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
