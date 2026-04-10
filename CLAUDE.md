# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Ouroboros Tester** is a spec-driven AI test automation framework. It uses specialized agents to explore web pages, document behavior as verified specs, then generate Playwright test infrastructure. The current domain is `profit-automation` targeting `https://dev.profitechnologies.com`.

## Commands

```bash
# Development
npm run build          # Compile TypeScript to dist/
npm run dev            # Watch mode compilation
npm run typecheck      # Type-check without emit

# Tests
npm test               # Run Playwright tests (headless)
npm run test:headed    # Run with browser visible
npm run test:ui        # Playwright UI mode
npm run test:debug     # Step-through debugger
npm run test:report    # Open HTML report

# Validation (Quality Gates)
npm run validate:specs   # Validate all specs via scripts/validate-spec.mjs

# API & Auth Utilities
npm run api:auth         # Login and save storageState
npm run api:probe        # Probe an API endpoint
npm run api:smoke        # Full auth + API smoke test
```

**Scripts directly:**
```bash
node scripts/validate-spec.mjs src/docs/.../spec.md   # Validate a single spec
node scripts/validate-spec.mjs --all                   # Validate all specs
node scripts/api-probe.mjs auth                        # Authenticate and save session
node scripts/api-probe.mjs probe GET /api/path         # Make authenticated API call
node scripts/api-probe.mjs verify-contract src/docs/.../spec.md
```

## Agent Pipeline

The project uses slash commands to invoke agents in sequence:

```
/orb-init <base-url>                          → Initialize config and state files
/orb-explore <url> --name "<name>" [--auth]   → crawl-explorer agent → writes specs to src/docs/
/orb-verify <page-slug> [--section <slug>]    → spec-verifier agent → verifies specs are accurate
/orb-architect [--force]                      → test-architect agent → generates POM/fixtures/helpers
/orb-write-tests <page-slug>                  → test-writer agent → writes test cases to src/tests/
/orb-run <url> --name "<name>"                → Full pipeline in sequence
/orb-status [--page <slug>]                   → Show progress dashboard
```

Agents are defined in `.github/agents/`, prompts in `.github/prompts/`, workflows in `.github/workflows/`.

### Multi-LLM Structure

Commands are thin wrappers — all logic lives in shared files:

| Path | Purpose | Used By |
|------|---------|---------|
| `.github/workflows/*.md` | Workflow steps — **source of truth** | Claude + Copilot |
| `.github/agents/*.md` | Agent protocols — **source of truth** | Claude + Copilot |
| `.claude/commands/orb-*.md` | Claude Code slash commands | Claude Code only |
| `.github/prompts/orb-*.prompt.md` | Copilot slash commands | GitHub Copilot only |

**Rule:** To update a command's behavior, edit only the shared workflow or agent file. Never duplicate workflow logic into command files. Both the Claude command and the Copilot prompt are thin wrappers that say "read + execute these shared files."

## Architecture

### File Organization
URL paths are mapped to folder hierarchies in kebab-case:
```
URL: /CategoryName/SubPage?tab=listing
  → src/docs/category-name/sub-page/sections/listing/spec.md   (generated spec)
  → src/pages/category-name/sub-page.page.ts                   (generated POM)
  → src/tests/category-name/sub-page/listing.spec.ts           (generated tests)
```

### Source Layout (`src/`)
- `docs/` — Generated specs, STATE.md, DOMAIN-TREE.md (specs are gitignored; STATE and DOMAIN-TREE are tracked)
- `base/` — BasePage class (all page objects inherit from this)
- `components/` — Reusable UI component objects (table, form, modal, navigation, toast)
- `fixtures/` — Playwright test fixtures (auth setup, data manager, domain fixture)
- `helpers/` — API helper, assertion helper, data factory, constants
- `utils/` — Config loader for `.ouroboros/config.json`
- `pages/` — Generated page objects (one per URL, query params become sections)
- `tests/` — Generated test specs

### Key Principles
1. **Spec-first:** Nothing is tested that isn't first documented in a verified spec (`src/docs/`)
2. **Proven interactions:** Every spec entry is backed by executed-and-observed Playwright evidence
3. **File-based state:** Progress tracked in `src/docs/STATE.md`; agents checkpoint after every action
4. **POM pattern:** Pages encapsulate interactions; components handle reusable UI (table, modal, etc.)
5. **Fixture injection:** Pages, data, and config are injected via Playwright fixtures
6. **User-facing locators:** `getByRole()`, `getByLabel()`, `getByText()` preferred over CSS selectors
7. **API helpers for data setup:** Direct API calls (not UI navigation) for test data creation

### Quality Gates
- After exploration: `validate-spec.mjs` must pass before spec-verifier runs
- After verification: `validate-spec.mjs` runs again with stricter rules
- After architecture: `validate-architecture.mjs` checks POM/fixtures/helpers integrity

### Configuration
`.ouroboros/config.json` (gitignored — contains credentials) controls base URL, auth settings, exploration options, and test output directory. Use `templates/config.template.json` as a reference.

## Spec Format

Specs are markdown files in `src/docs/{module}/{page}/sections/{section}/spec.md`. They follow Given/When/Then scenarios and must include:
- UI elements with ARIA roles and recommended locators
- API contracts (method, path, request/response shapes)
- Interaction Recipes (trigger → locator → Playwright method → assertion → signal)
- Mutation side effects (what changes after each operation)
- Feedback mechanisms (exact toast/alert messages and their locators)

See `templates/section-spec.md` for the full template structure.
