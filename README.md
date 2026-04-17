<div align="center">

# OUROBOROS TESTER

**AI-driven domain test automation with Playwright**

[![npm version](https://img.shields.io/npm/v/ouroboros-tester?style=flat-square&logo=npm&logoColor=white)](https://www.npmjs.com/package/ouroboros-tester)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Playwright](https://img.shields.io/badge/Playwright-%3E%3D1.40-45ba4b?style=flat-square&logo=playwright&logoColor=white)](https://playwright.dev)

[Quick Start](#quick-start) · [How It Works](#how-it-works) · [Commands](#commands) · [Architecture](#architecture) · [CLI Reference](#cli-reference)

</div>

---

## What is this?

You point it at a web app. AI agents explore, document, and write Playwright tests — automatically.

```text
You: /orb-explore https://app.example.com/products --name "Products"
AI:  Navigating https://app.example.com/products...
     ✓ Discovered 4 sections: listing, detail, create, filters
     ✓ Documented 23 requirements with Given/When/Then scenarios
     ✓ Captured API contracts, locators, and interaction recipes
     ✓ Specs written to src/docs/products/

You: /orb-verify products
AI:  Re-crawling to verify spec accuracy...
     ✓ 23/23 requirements verified against live page
     ✓ All interaction recipes re-executed successfully

You: /orb-architect
AI:  ✓ Generated ProductsPage (POM) with section methods
     ✓ Created test fixtures and data factory
     ✓ Set up API helper for test data lifecycle

You: /orb-write-tests products
AI:  ✓ Written 18 test cases across 4 spec files
     ✓ All tests use Page Object Model pattern
     ✓ Test data managed via API (create → test → cleanup)
```

No manual test writing. No guessing at selectors. Every test is backed by a verified spec that was proven against the live application.

---

## The Problem

Writing end-to-end tests is tedious:

- **Exploring the app** — clicking through every page, every state, every edge case
- **Finding selectors** — inspecting DOM, guessing at stable locators, hoping they don't break
- **Writing page objects** — boilerplate for every page, every component, every interaction
- **Maintaining tests** — specs drift from reality, tests break, nobody knows why

Most teams either skip E2E tests entirely or write fragile ones that cost more to maintain than they save.

## The Solution

Ouroboros Tester flips the process. Instead of humans writing tests from memory, AI agents **explore the live application**, **document what they find as verified specs**, and then **generate test infrastructure and test cases** from those specs.

Every spec entry is backed by **executed Playwright evidence** — the agent actually clicked the button, filled the form, observed the response. Nothing is assumed.

---

## Quick Start

**Requires Node.js 20+ and an AI coding assistant** (GitHub Copilot or Claude Code).

### Install

```bash
npm install -g ouroboros-tester
```

### Scaffold a project

```bash
mkdir my-app-tests && cd my-app-tests
orb init https://your-app.com
```

This creates a fully configured test project:

```
my-app-tests/
├── .ouroboros/config.json          ← Project config (base URL, auth)
├── .ouroboros/testing-scope.md     ← Define what to test / skip
├── .github/agents/                 ← AI agent definitions
├── .github/prompts/                ← Slash commands for your AI assistant
├── scripts/                        ← API probe, spec validators
├── src/                            ← Your test code lives here
├── package.json
└── tsconfig.json
```

### Run the pipeline

Open the project in VS Code with GitHub Copilot (or Claude Code) and use slash commands:

```
/orb-explore https://your-app.com/dashboard --name "Dashboard"
/orb-verify dashboard
/orb-architect
/orb-write-tests dashboard
```

Or run the full pipeline in one shot:

```
/orb-run https://your-app.com/dashboard --name "Dashboard"
```

### Run your tests

```bash
npm test                    # Headless
npm run test:headed         # With browser visible
npm run test:ui             # Playwright UI mode
npm run test:debug          # Step-through debugger
```

---

## How It Works

Four specialized AI agents form a pipeline. Each agent has a defined role, reads/writes specific files, and must pass a quality gate before the next agent runs.

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  crawl-      │    │  spec-       │    │  test-        │    │  test-        │
│  explorer    │ →  │  verifier    │ →  │  architect    │ →  │  writer       │
│              │    │              │    │               │    │               │
│  Explore &   │    │  Re-crawl &  │    │  Generate     │    │  Write test   │
│  document    │    │  verify      │    │  POM/fixtures │    │  cases        │
└──────┬───────┘    └──────┬───────┘    └──────┬────────┘    └──────┬────────┘
       │                   │                   │                    │
       ▼                   ▼                   ▼                    ▼
   src/docs/           src/docs/          src/pages/           src/tests/
   (specs)             (verified)         src/fixtures/        (*.spec.ts)
```

### Stage 1: Explore

The **crawl-explorer** agent navigates the target page using Playwright MCP. It discovers sections, interacts with every element, and documents findings as structured specs.

Every interaction is proven with executable evidence:
- **Element Proof Protocol** — locator verified to resolve exactly one element
- **DOM Diffing** — before/after snapshots prove the interaction caused the expected change
- **Assertion Dry Runs** — the assertion that will appear in the test is executed live

Produces two files per section:
- `spec.md` — Requirements with Given/When/Then scenarios (the "what to test")
- `impl.md` — Locators, interaction recipes, API contracts (the "how to test")

### Stage 2: Verify

The **spec-verifier** agent re-crawls the page independently. It re-executes every interaction recipe, verifies API contracts against live endpoints, and runs flow simulations (full CRUD chains). Incorrect specs are fixed. Accurate ones are marked verified.

### Stage 3: Architect

The **test-architect** agent reads verified specs and generates the test infrastructure:
- **Page Object Models** — one per page, with methods mapped to interaction recipes
- **Test fixtures** — Playwright fixtures for dependency injection
- **Data factory** — generates test data with unique values
- **Constants** — routes, validation messages, field mappings

### Stage 4: Write Tests

The **test-writer** agent writes Playwright test cases from verified specs using the architecture from stage 3. Tests follow the POM pattern, use API helpers for data setup, and include proper assertions.

### Quality Gates

Each stage has a validation script that must pass before handoff:

| Gate | Script | Validates |
|------|--------|-----------|
| After explore | `validate-spec.mjs` | Spec completeness, required sections, scenario format |
| After verify | `validate-spec.mjs` | Stricter rules, verification status |
| After architect | `validate-architecture.mjs` | POM/fixture/helper integrity |

---

## Commands

All commands work in both GitHub Copilot and Claude Code.

### Pipeline

| Command | What it does |
|---------|--------------|
| `/orb-init <url>` | Initialize project configuration and state files |
| `/orb-explore <url> --name "<name>"` | Explore a page, discover sections, write specs |
| `/orb-verify <page-slug>` | Verify spec accuracy by re-crawling |
| `/orb-architect` | Generate POM, fixtures, helpers from verified specs |
| `/orb-write-tests <page-slug>` | Write test cases from verified specs |
| `/orb-run <url> --name "<name>"` | Full pipeline: explore → verify → architect → write |
| `/orb-status` | Show progress dashboard |

### Options

| Flag | Used with | Description |
|------|-----------|-------------|
| `--auth` | `explore`, `init` | Enable authentication setup |
| `--section <slug>` | `verify` | Verify a specific section only |
| `--force` | `architect` | Regenerate architecture even if it exists |

---

## Architecture

### What ships in the npm package

The package provides reusable test infrastructure that domain-specific code builds on:

| Export | Purpose |
|--------|---------|
| `BasePage` | Base class for all Page Object Models |
| `TableComponent` | Reusable table interactions (sort, filter, paginate) |
| `FormComponent` | Form fill, submit, validation |
| `ModalComponent` | Modal open, close, confirm |
| `NavigationComponent` | Nav menu, breadcrumb, tabs |
| `ToastComponent` | Toast/notification assertions |
| `createBaseFixtures` | Fixture factory for Playwright tests |
| `DataManager` | Test data lifecycle (track, create, cleanup) |
| `APIHelper` | Authenticated API calls for data setup |
| `AssertionHelper` | Common assertion patterns |
| `loadConfig` | Load `.ouroboros/config.json` |

### What agents generate per-project

| Directory | Contents |
|-----------|----------|
| `src/docs/` | Specs (`spec.md` + `impl.md`), `STATE.md`, `DOMAIN-TREE.md` |
| `src/pages/` | Page Object Models (one per URL path) |
| `src/fixtures/` | Domain test fixture extending base |
| `src/helpers/` | Constants, data factory |
| `src/tests/` | Test files, Playwright config, auth setup |

### File Organization

URL paths map directly to folder structure:

```
URL: /CategoryName/SubPage?tab=listing

  → src/docs/category-name/sub-page/sections/listing/spec.md
  → src/docs/category-name/sub-page/sections/listing/impl.md
  → src/pages/category-name/sub-page.page.ts
  → src/tests/category-name/sub-page/listing.spec.ts
```

### Key Patterns

| Pattern | Why |
|---------|-----|
| **Page Object Model** | Encapsulate page interactions in reusable classes |
| **Fixture-based DI** | Inject pages, data, config via Playwright fixtures |
| **Component objects** | Reusable UI abstractions (table, form, modal) |
| **API helpers for data** | Fast setup/teardown via direct API calls, not UI navigation |
| **Auth via storageState** | Authenticate once, share session across workers |
| **User-facing locators** | `getByRole()`, `getByLabel()`, `getByText()` over CSS selectors |

---

## CLI Reference

### `orb init <base-url>`

Scaffold a new test project targeting a web application.

```bash
orb init https://app.example.com
orb init https://app.example.com --name "My App Tests"
orb init https://app.example.com --auth              # Enable auth setup
orb init https://app.example.com --dir ./tests        # Custom directory
orb init https://app.example.com --skip-install       # Skip npm install
```

**What it creates:**
- `package.json` with `ouroboros-tester` as a dependency
- `.ouroboros/config.json` with base URL and project settings
- `.ouroboros/testing-scope.md` for defining what to test
- `tsconfig.json` configured for the project
- Agent definitions, prompts, and workflow files
- Validation scripts

### Configuration

Project settings live in `.ouroboros/config.json` (gitignored — may contain credentials):

```json
{
  "project": {
    "name": "my-app-tests",
    "baseUrl": "https://app.example.com"
  },
  "auth": {
    "required": true,
    "loginUrl": "https://app.example.com/login",
    "username": "test@example.com",
    "password": "..."
  }
}
```

### Testing Scope

Control what agents explore and test via `.ouroboros/testing-scope.md`:

```markdown
## What to test
- Product listing CRUD operations
- User profile settings

## What not to test
- Admin panel
- Billing/payment flows
```

Scope is a hard constraint — agents will not explore, document, or test anything excluded.

---

## Validation Scripts

Quality gates that ensure specs and architecture meet standards before progressing.

```bash
# Validate a single spec
node scripts/validate-spec.mjs src/docs/products/sections/listing/spec.md

# Validate all specs
node scripts/validate-spec.mjs --all

# Validate architecture integrity
node scripts/validate-architecture.mjs

# API probe utilities
node scripts/api-probe.mjs auth                          # Authenticate
node scripts/api-probe.mjs probe GET /api/products        # Probe endpoint
node scripts/api-probe.mjs verify-contract src/docs/.../impl.md  # Verify API contract
```

---

## Supported AI Tools

Ouroboros Tester works with AI coding assistants that support Playwright MCP (browser automation). Commands are provided as:

| Tool | Command format | Location |
|------|---------------|----------|
| **GitHub Copilot** | `/orb-*` slash commands | `.github/prompts/orb-*.prompt.md` |
| **Claude Code** | `/orb-*` slash commands | `.claude/commands/orb-*.md` |

Both tools reference the same shared workflow and agent files — behavior is identical regardless of which assistant you use.

---

## Design Philosophy

```text
→ spec-first, not code-first
→ proven interactions, not assumed ones
→ agents explore, humans review
→ test what you document, document what you prove
→ reusable infrastructure, domain-specific tests
```

---

## Development

```bash
git clone https://github.com/hadetan/ouroboros-tester.git
cd ouroboros-tester
npm install
npm run build          # Compile TypeScript to dist/
npm run dev            # Watch mode
npm run typecheck      # Type-check without emit
```

---

## License

MIT
