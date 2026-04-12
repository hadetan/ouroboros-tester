<p align="center">
  <img src="assets/ouroboros-banner.png" alt="Ouroboros Tester" width="100%">
</p>

<p align="center">
  <strong>AI-driven domain test automation for any web application.</strong>
</p>

<p align="center">
  <a href="./LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" /></a>
  <a href="https://playwright.dev"><img alt="Playwright" src="https://img.shields.io/badge/Playwright-2EAD33?style=flat-square&logo=playwright&logoColor=white" /></a>
  <a href="https://www.typescriptlang.org"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" /></a>
  <!-- <a href="https://www.npmjs.com/package/ouroboros-tester"><img alt="npm version" src="https://img.shields.io/npm/v/ouroboros-tester?style=flat-square" /></a> -->
</p>

<p align="center">
  Point at a URL. Get verified specs and a complete Playwright test suite.<br>
  No manual test writing. No guessing at selectors. No stale documentation.
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> · <a href="#how-it-works">How It Works</a> · <a href="#commands">Commands</a> · <a href="#agents">Agents</a> · <a href="ARCHITECTURE.md">Architecture</a>
</p>

---

## The Problem

Writing E2E tests for a web application is slow, tedious, and the tests go stale the moment the UI changes. You spend hours inspecting elements, writing page objects, and maintaining specs that nobody reads.

Ouroboros Tester eliminates all of that. Four AI agents — backed by Playwright MCP — explore your application, document what they find as verified specs, generate the entire test infrastructure, and write comprehensive test suites. You just point them at a URL.

```text
→ spec-first, not test-first
→ verified against live UI, not assumed
→ generated from evidence, not guesses
→ one command to go from URL to test suite
```

---

## See It in Action

```text
You: /orb-explore https://app.example.com/users --name "User Management"
AI:  🔍 Navigating to /users...
     Found 4 sections: user-table, create-form, edit-form, filters
     Documenting CRUD operations...
     ✓ src/docs/users/sections/user-table/spec.md     (12 scenarios)
     ✓ src/docs/users/sections/create-form/spec.md    (8 scenarios)
     ✓ src/docs/users/sections/edit-form/spec.md      (6 scenarios)
     ✓ src/docs/users/sections/filters/spec.md        (4 scenarios)
     Validation passed. Ready for verification.

You: /orb-verify users
AI:  Re-crawling /users with goal-backward verification...
     ✓ "Can a user create a new record?"  — confirmed
     ✓ "Can a user edit an existing record?" — confirmed
     ✗ "Does the delete button show a confirmation?" — spec said modal, actual is inline confirm
     Fixed spec. All 30 scenarios verified.

You: /orb-architect
AI:  Analyzing verified specs...
     ✓ src/pages/users.page.ts                (POM with 14 methods)
     ✓ src/fixtures/test.fixture.ts           (domain fixture)
     ✓ src/helpers/data-factory.ts            (user data generators)
     Architecture validated.

You: /orb-write-tests users
AI:  Writing tests from verified specs...
     ✓ src/tests/users/user-table.spec.ts     (12 tests)
     ✓ src/tests/users/create-form.spec.ts    (8 tests)
     ✓ src/tests/users/edit-form.spec.ts      (6 tests)
     ✓ src/tests/users/filters.spec.ts        (4 tests)
     30 tests written. 28 passing, 2 need data setup.
```

Or run the full pipeline in one shot:

```
/orb-run https://app.example.com/users --name "User Management"
```

---

## Quick Start

**Requires Node.js 20+ and VS Code with GitHub Copilot Chat.**

### 1. Install

```bash
npm install
npx playwright install chromium
```

### 2. Configure Playwright MCP

Add to your VS Code MCP settings (`~/Library/Application Support/Code/User/mcp.json` on macOS):

```json
{
  "servers": {
    "microsoft/playwright-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

### 3. Initialize for your domain

```
/orb-init
```

The agent asks for your base URL, project name, and auth details. Creates `.ouroboros/config.json` and all required directories.

### 4. Explore → Verify → Architect → Test

```
/orb-explore https://app.example.com/users --name "User Management"
/orb-verify users
/orb-architect
/orb-write-tests users
```

### 5. Run the tests

```bash
npm test                    # headless
npm run test:headed         # with browser visible
npm run test:ui             # Playwright UI mode
npm run test:debug          # step-through debugger
npm run test:report         # open HTML report
```

---

## How It Works

Four agents form a pipeline. Each reads the output of the previous one, and quality gates between stages ensure nothing moves forward without validation.

```
  /orb-explore       /orb-verify        /orb-architect     /orb-write-tests
       |                  |                   |                  |
       v                  v                   v                  v
  +----------+       +----------+       +----------+       +----------+
  |  crawl-  | ----> |  spec-   | ----> |  test-   | ----> |  test-   |
  |  explorer|       |  verifier|       |  architect|       |  writer  |
  +----------+       +----------+       +----------+       +----------+
       |                  |                   |                  |
   Discovers          Validates          Generates           Writes
   sections &         every claim        POM, fixtures,      test
   CRUD ops           against live UI    components          suites
       |                  |                   |                  |
       v                  v                   v                  v
   src/docs/          src/docs/          src/pages/          src/tests/
   (raw specs)        (verified specs)   src/fixtures/       (*.spec.ts)
                                         src/helpers/
       '                  '                   '
       +-- validate-spec.mjs -+   validate-architecture.mjs
```

**Key insight:** The spec-verifier doesn't trust the explorer. It re-crawls every page and asks "can a user *actually* do this?" — not "did the explorer document this?". Specs that fail verification are corrected on the spot.

---

## Commands

All commands are VS Code slash commands. Type `/orb` to see them.

| Command | Arguments | What it does |
|---------|-----------|--------------|
| `/orb-init` | `<base-url>` | Initialize project for a domain |
| `/orb-explore` | `<url> --name "<name>" [--auth]` | Explore a page, document all sections as specs |
| `/orb-verify` | `<page-slug> [--section <slug>]` | Verify spec accuracy against the live site |
| `/orb-architect` | `[--force]` | Generate test infrastructure from verified specs |
| `/orb-write-tests` | `<page-slug> [--section <slug>]` | Write test cases from verified specs |
| `/orb-status` | `[--page <slug>]` | Show progress dashboard |
| `/orb-run` | `<url> --name "<name>" [--auth]` | Full pipeline: explore → verify → architect → write |

---

## Agents

Each agent is a VS Code custom agent mode with tools restricted to its role.

### crawl-explorer

Navigates to the target URL using Playwright MCP. Discovers every section of the page — tables, forms, modals, filters. Tests valid and invalid data paths. Captures network requests and validation rules. Every interaction is backed by executable evidence (Element Proof Protocol, DOM Diffing, Assertion Dry Runs).

**Output:** Structured specs in `src/docs/` with Given/When/Then scenarios

### spec-verifier

Re-crawls pages documented by the explorer using **goal-backward verification**. Re-executes every Interaction Recipe, verifies API contracts against live endpoints, and runs full CRUD chain simulations. Corrects inaccuracies and marks specs as verified.

**Output:** Verified specs in `src/docs/` — the single source of truth

### test-architect

Reads verified specs and designs the entire test project. Analyzes cross-page patterns to identify shared components. Generates POM classes, fixtures, component objects, helpers, data factories, and API utilities.

**Output:** Complete test infrastructure in `src/pages/`, `src/fixtures/`, `src/helpers/`

### test-writer

Reads verified specs and the generated architecture. Writes comprehensive test suites covering every documented CRUD operation, including cross-page relationship tests. Follows a structured Failure Diagnosis Protocol — max 3 retries per test before escalating.

**Output:** Test files in `src/tests/{module}/{page}/{section}.spec.ts`

---

## Spec Format

Every section produces **two files** — the "what" and the "how":

| File | Contains | Used by |
|------|----------|---------|
| `spec.md` | Requirements, Given/When/Then scenarios, states | test-writer (test structure) |
| `impl.md` | Locators, Interaction Recipes, API contracts, field mappings | test-architect + test-writer (implementation) |

```markdown
## Requirements

### Requirement: User Creation
The system SHALL allow admins to create a new user via the creation form.

#### Scenario: Successful creation with valid data
- GIVEN the user is on the User Management page
- AND the Create User section is visible
- WHEN the user clicks "Add User"
- AND fills in Name, Email, and Role with valid values
- AND clicks "Save"
- THEN a new user is created
- AND a success toast "User created successfully" is displayed
- AND the new user appears in the users table

#### Scenario: Validation error on missing required field
- GIVEN the user is on the Create User form
- WHEN the user leaves Email empty
- AND clicks "Save"
- THEN a validation error "Email is required" is displayed
- AND the form is not submitted
```

---

## Test Architecture

Everything lives in `src/`. The test-architect generates a complete Playwright project from verified specs.

| Pattern | Purpose |
|---------|---------|
| **Page Object Model** | Each page gets a class encapsulating its interactions |
| **Component Objects** | Reusable UI components (table, form, modal, toast, navigation) shared across pages |
| **Fixture-based DI** | Pages, data managers, and config injected via Playwright fixtures |
| **Data Factory** | Domain-aware test data generators built from field definitions in specs |
| **API Helper** | Direct backend API calls for fast test data setup/teardown |
| **Auth via storageState** | Authenticate once per worker, share session across all tests |

```typescript
import { test, expect } from '../../../fixtures/test.fixture';

test('should create a user', async ({ page, usersPage, dataManager }) => {
  const user = dataManager.generate.user();
  await usersPage.createUser(user);
  await expect(page.getByText(user.firstName)).toBeVisible();
});
```

---

## Project Structure

```
ouroboros-tester/
├── src/                              # Everything lives here
│   ├── base/page.ts                  # BasePage class
│   ├── fixtures/                     # Auth setup, data manager, domain fixture
│   │   ├── base.fixture.ts
│   │   ├── auth.setup.ts
│   │   ├── data.fixture.ts
│   │   └── test.fixture.ts
│   ├── helpers/                      # API helper, constants, data factory
│   │   ├── api.helper.ts
│   │   ├── constants.ts
│   │   └── data-factory.ts
│   ├── utils/config.ts               # Config loader (.ouroboros/)
│   ├── pages/                        # Generated page objects (POMs)
│   ├── docs/                         # Generated specs (spec.md + impl.md)
│   │   ├── STATE.md                  # Progress tracking
│   │   ├── DOMAIN-TREE.md            # Cross-page entity relationships
│   │   └── {module}/{page}/sections/
│   └── tests/                        # Generated test cases
│       ├── playwright.config.ts
│       ├── fixtures/auth.setup.ts    # Auth setup for test runner
│       └── {module}/{page}/{section}.spec.ts
│
├── .github/
│   ├── agents/                       # Agent definitions (source of truth)
│   ├── prompts/                      # VS Code Copilot slash commands
│   ├── workflows/                    # Workflow orchestration
│   └── instructions/                 # Project-wide instructions
│
├── .claude/commands/                 # Claude Code slash commands
│
├── .ouroboros/                       # Runtime config (gitignored)
│   ├── config.json                   # Project configuration
│   ├── testing-scope.md              # What to test / what to skip
│   └── test-map.json                 # Spec-to-test mapping
│
├── playwright/
│   ├── .auth/                        # Stored auth sessions
│   └── trash/                        # Temp browser data (gitignored)
│
├── scripts/                          # Validation & API utilities
│   ├── validate-spec.mjs            # Quality gate: spec completeness
│   ├── validate-architecture.mjs    # Quality gate: POM/fixture integrity
│   └── api-probe.mjs                # Auth, API probing, ad-hoc browser exec
│
├── templates/                        # Scaffolding templates
├── AGENTS.md                         # Agent overview
├── ARCHITECTURE.md                   # System architecture
├── CLAUDE.md                         # Claude Code guidance
├── tsconfig.json
└── tsconfig.build.json
```

<details>
<summary><strong>URL-Based Folder Convention</strong></summary>

Pages and tests mirror the application's URL structure. Each path segment is kebab-cased. Query-parameter tabs become sections within the page folder.

```
URL: /CategoryName/SubPage?tab=listing
  → src/docs/category-name/sub-page/sections/listing/spec.md
  → src/docs/category-name/sub-page/sections/listing/impl.md
  → src/pages/category-name/sub-page.page.ts
  → src/tests/category-name/sub-page/listing.spec.ts
```

</details>

---

## Configuration

`.ouroboros/config.json` controls all agent behavior:

```json
{
  "project": {
    "name": "My App",
    "baseUrl": "https://app.example.com",
    "apiBaseUrl": "https://api.example.com"
  },
  "auth": {
    "required": true,
    "loginUrl": "https://app.example.com/login",
    "credentials": {
      "default": { "username": "...", "password": "..." }
    },
    "storageStatePath": "playwright/.auth/storage-state.json"
  },
  "exploration": {
    "screenshotOnAction": true,
    "captureNetworkRequests": true,
    "maxSectionsPerPage": 50,
    "waitTimeout": 5000
  },
  "testing": {
    "outputDir": "src/tests",
    "browsers": ["chromium"],
    "parallel": true,
    "retries": 1,
    "traceOnFailure": true
  }
}
```

> [!IMPORTANT]
> Add `.ouroboros/config.json` to `.gitignore` if it contains credentials. Use environment variables for CI:
> ```bash
> TC_USERNAME=... TC_PASSWORD=... npm test
> ```

### Testing Scope

`.ouroboros/testing-scope.md` lets you define what agents should and shouldn't test. Scope is a hard constraint — agents treat it as law.

- **"What to test" has entries:** Only those operations are explored, verified, and tested.
- **"What not to test" has entries:** Those items are invisible to all agents.
- **Both empty or missing:** Agents process everything they find.

---

## Domain Tree

As the explorer discovers that entities created on one page appear on another, it maps those relationships in `src/docs/DOMAIN-TREE.md`. The test-writer uses this to generate cross-page test cases.

```
users/create-form       ──creates──▶  users/user-table
users/user-table        ──flows──▶    dashboard/recent-activity
settings/roles          ──populates── users/create-form (role dropdown)
```

---

## State Tracking

`src/docs/STATE.md` tracks all progress. Run `/orb-status` at any time:

```
Ouroboros Tester Dashboard
══════════════════════════════════════════════════

Domain: My App (https://app.example.com)

Pages:
  ● user-management    ████████████░░░░  75%  [3/4 sections, 2 verified, 1 tested]
  ● dashboard                ██████░░░░░░░░░░  37%  [2/3 sections, 1 verified, 0 tested]
  ○ settings                    ░░░░░░░░░░░░░░░░   0%  [not started]

Test Infrastructure: ✓ Set up
Tests: 12 written, 10 passing, 2 failing

Next Steps:
  → /orb-explore https://app.example.com/settings --name "Settings"
  → /orb-verify dashboard
```

---

## Quality Gates

Validation scripts act as hard gates between pipeline stages. Nothing moves forward without passing.

| Gate | Runs after | Validates |
|------|------------|-----------|
| `validate-spec.mjs` | explore, verify | Spec completeness: required fields, scenario format, cross-references |
| `validate-architecture.mjs` | architect | POM integrity: fixture wiring, component usage, import paths |

```bash
npm run validate:specs                               # all specs
node scripts/validate-spec.mjs src/docs/.../spec.md  # single spec
```

---

## Design Principles

- **Spec-first** — Nothing is tested that isn't first documented in a verified spec
- **Proven interactions** — Every spec entry is backed by executed-and-observed Playwright evidence
- **Goal-backward verification** — Verify "can users do X?" not "did the agent write Y?"
- **File-based state** — All progress lives in Markdown — readable, diffable, committable
- **Cross-page awareness** — Data relationships between pages are tracked and tested end-to-end
- **User-facing locators** — `getByRole()`, `getByLabel()`, `getByText()` preferred over CSS selectors
- **API for data, UI for assertions** — Direct API calls for test setup; UI interactions for what users actually see

---

## Scripts

```bash
# Development
npm run build              # Compile TypeScript to dist/
npm run dev                # Watch mode compilation
npm run typecheck          # Type-check without emit

# Tests
npm test                   # Run Playwright tests (headless)
npm run test:headed        # With browser visible
npm run test:ui            # Playwright UI mode
npm run test:debug         # Step-through debugger
npm run test:report        # Open HTML report

# Validation
npm run validate:specs     # Validate all specs

# API Utilities
npm run api:auth           # Login and save storageState
npm run api:probe          # Probe an API endpoint
npm run api:smoke          # Full auth + API smoke test
```

---

## Multi-LLM Support

Commands are thin wrappers — all logic lives in shared workflow and agent files. This means Ouroboros Tester works with both Claude Code and GitHub Copilot without duplicating any behavior.

| Path | Purpose | Used By |
|------|---------|---------|
| `.github/workflows/*.md` | Workflow steps (source of truth) | Claude + Copilot |
| `.github/agents/*.md` | Agent protocols (source of truth) | Claude + Copilot |
| `.claude/commands/orb-*.md` | Claude Code slash commands | Claude Code |
| `.github/prompts/orb-*.prompt.md` | Copilot slash commands | GitHub Copilot |

To update a command's behavior, edit only the shared workflow or agent file. Never duplicate logic into command wrappers.

---

## Contributing

Bug fixes and improvements welcome as PRs. For larger changes, open an issue first so we can align on approach.

### Development

```bash
npm install
npm run build
npm run typecheck
```

---

## License

MIT
