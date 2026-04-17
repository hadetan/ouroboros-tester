# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Ouroboros Tester** is a spec-driven AI test automation framework published as an npm package. It uses specialized agents to explore web pages, document behavior as verified specs, then generate Playwright test infrastructure. Users install it globally (`npm install -g ouroboros-tester`) and scaffold new projects with `orb init <url>`.

## Package Structure

This repo IS the npm package. It contains:
- **Framework source** (`src/base`, `src/components`, `src/fixtures`, `src/helpers`, `src/utils`) — compiled to `dist/`, shipped in the package
- **CLI** (`src/cli/`, `bin/orb.js`) — the `orb` command for project scaffolding
- **Agent/workflow definitions** (`.github/agents`, `.github/workflows`, `.github/prompts`) — copied to user projects during init
- **Scripts** (`scripts/`) — API probe, validators — copied to user projects
- **Templates** (`templates/`) — scaffolding templates for new projects

Domain-specific code (`src/pages`, `src/tests`, `src/docs`) is generated per-project by agents and NOT tracked here.

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
node scripts/api-probe.mjs verify-contract src/docs/.../impl.md
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
URL paths are mapped to folder hierarchies in kebab-case. Each section produces **two files**: `spec.md` (scenarios & requirements) and `impl.md` (technical implementation details):
```
URL: /CategoryName/SubPage?tab=listing
  → src/docs/category-name/sub-page/sections/listing/spec.md   (scenarios & requirements)
  → src/docs/category-name/sub-page/sections/listing/impl.md   (technical: recipes, locators, API)
  → src/pages/category-name/sub-page.page.ts                   (generated POM)
  → src/tests/category-name/sub-page/listing.spec.ts           (generated tests)
```

### Source Layout (`src/`)

**Framework code (in npm package, tracked in git):**
- `index.ts` — Public API exports
- `cli/` — CLI commands (init, etc.)
- `base/` — BasePage class (all page objects inherit from this)
- `components/` — Reusable UI component objects (table, form, modal, navigation, toast)
- `fixtures/` — Base Playwright test fixtures (base fixture, data manager)
- `helpers/` — API helper, assertion helper
- `utils/` — Config loader for `.ouroboros/config.json`

**Domain code (generated per-project by agents, NOT in npm package):**
- `docs/` — Generated specs (spec.md + impl.md per section), STATE.md, DOMAIN-TREE.md
- `pages/` — Generated page objects (one per URL, query params become sections)
- `tests/` — Generated test specs + playwright config + auth setup
- `fixtures/test.fixture.ts` — Domain-specific test fixture (extends base)
- `helpers/constants.ts` — Domain routes, messages, validation rules
- `helpers/data-factory.ts` — Entity generators (domain-specific)

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

`.ouroboros/testing-scope.md` lets users define what to test and what to skip. All agents read this file before running. If both sections are empty, agents use their default behavior. Created by `/orb-init`.

## Spec Format (Two-File Structure)

Each section produces **two files** in `src/docs/{module}/{page}/sections/{section}/`:

### `spec.md` — Scenarios & Requirements
The "what to test" — business behavior documented as Given/When/Then scenarios:
- Section description and URL location
- Requirements with Given/When/Then test scenarios
- States (loading, empty, error)
- Cross-page references
- Verification status

### `impl.md` — Technical Implementation
The "how to test" — locators, recipes, API contracts, and framework details:
- UI elements with ARIA roles and recommended locators
- UI framework & component details (library, patterns)
- Interaction Recipes (trigger → locator → Playwright method → assertion → signal)
- Form fields with types, validation rules, and defaults
- API contracts (method, path, request/response shapes)
- Field name mappings (UI label → API field → DB column)
- Mutation side effects (what changes after each operation)
- Feedback mechanisms (exact toast/alert messages and their locators)
- Concurrency & timing notes

Both files cross-link to each other. Agents read `spec.md` for test structure and `impl.md` for implementation details.

See `templates/section-spec.md` and `templates/section-impl.md` for template structures.
