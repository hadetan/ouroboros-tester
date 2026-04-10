# Ouroboros Tester

> AI-driven domain test automation — explore, document, verify, and generate Playwright tests for any web application using VS Code agents and Playwright MCP.

---

## How It Works

Ouroboros Tester uses a pipeline of four specialized AI agents, each backed by a VS Code custom agent mode, to take a web application from zero to a fully covered Playwright test suite.

```
/orb-init
   └─▶ Sets up project config, templates, and state

/orb-explore <url> --name "<page>"
   └─▶ crawl-explorer agent navigates the page
       Discovers every section and CRUD operation
       Writes structured specs to src/docs/

/orb-verify <page-slug>
   └─▶ spec-verifier agent re-crawls the page
       Validates every documented claim against reality
       Marks specs as verified or corrects inaccuracies

/orb-architect
   └─▶ test-architect agent reads all verified specs
       Generates POM, fixtures, components, helpers
       Creates the full test project structure in src/

/orb-write-tests <page-slug>
   └─▶ test-writer agent reads verified specs + architecture
       Writes comprehensive CRUD test suites
       Runs tests and reports results
```

Or run the full pipeline in one command:

```
/orb-run <url> --name "<page>"
```

---

## Prerequisites

- **VS Code** with the **GitHub Copilot Chat** extension
- **Playwright MCP** server configured (`microsoft/playwright-mcp`)
- **Node.js** v18 or later

Verify your MCP server is set up with the following in `~/Library/Application Support/Code/User/mcp.json` (macOS) or the equivalent on your platform:

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

---

## Quick Start

### 1. Install dependencies

```bash
npm install
npx playwright install chromium
```

### 2. Initialize Ouroboros Tester for your domain

Type in VS Code chat:

```
/orb-init
```

The agent will ask for your base URL, project name, authentication details, and optional API base URL. It creates `.ouroboros/config.json` and all required directories.

### 3. Explore a page

```
/orb-explore https://app.example.com/users --name "User Management"
```

### 4. Verify the specs

```
/orb-verify user-management
```

### 5. Generate the test infrastructure

```
/orb-architect
```

### 6. Write tests

```
/orb-write-tests user-management
```

### Run the test suite

```bash
npm test                    # headless
npm run test:headed         # with browser visible
npm run test:ui             # Playwright UI mode
npm run test:debug          # step-through debugger
npm run test:report         # open HTML report
```

---

## Commands

All commands appear as slash commands in VS Code chat. Type `/tc` to see them.

| Command | Arguments | Purpose |
|---------|-----------|---------|
| `/orb-init` | `<base-url>` | Initialize Ouroboros Tester for a new domain |
| `/orb-explore` | `<url> --name "<name>" [--auth]` | Explore a page and document all sections |
| `/orb-verify` | `<page-slug> [--section <slug>] [--auth]` | Verify spec accuracy against the live site |
| `/orb-architect` | `[--force]` | Generate Playwright test project from verified specs |
| `/orb-write-tests` | `<page-slug> [--section <slug>] [--type create\|read\|update\|delete]` | Write test cases from verified specs |
| `/orb-status` | `[--page <slug>]` | Show exploration and test coverage dashboard |
| `/orb-run` | `<url> --name "<name>" [--auth]` | Full pipeline: explore → verify → architect → write |

---

## Agents

Ouroboros Tester uses four purpose-built VS Code agents, each with restricted tools appropriate to its role.

### `crawl-explorer`
Navigates to a target URL and systematically explores every section of the page, documenting all CRUD operations it discovers. Goes left-to-right, top-to-bottom. Tests both valid and invalid data paths. Captures network requests, screenshots, and validation rules.

**Tools:** `microsoft/playwright-mcp/*`, `read`, `edit`, `search`, `execute`

**Output:** Section spec files at `src/docs/{module}/{page}/sections/{section-slug}/spec.md`

---

### `spec-verifier`
Takes the specs written by the explorer and re-crawls the same pages using a **goal-backward** approach. Instead of asking "did the explorer document this?", it asks "can a user *actually* do this?". Every Given/When/Then scenario is executed against the live application.

**Tools:** `microsoft/playwright-mcp/*`, `read`, `edit`, `search`, `execute`

**Output:** Specs updated with `verified: true` or corrected where inaccurate

---

### `test-architect`
Reads all verified specs and designs the test infrastructure. Analyzes cross-page patterns to identify shared components, then generates a complete Playwright project with POM classes, fixtures, and reusable component objects.

**Tools:** `read`, `edit`, `search`, `execute`

**Output:** Full test project under `src/` (pages, fixtures, helpers)

---

### `test-writer`
Reads verified specs and the generated architecture to write comprehensive test suites. Generates complete `describe`/`test` blocks for every CRUD operation documented in the specs, including cross-page relationship tests.

**Tools:** `microsoft/playwright-mcp/*`, `read`, `edit`, `search`, `execute`

**Output:** Test files at `src/tests/{module}/{page}/{section-slug}.spec.ts`

---

## Project Structure

```
.
├── .github/
│   ├── agents/
│   │   ├── crawl-explorer.md       # Explorer agent definition
│   │   ├── spec-verifier.md        # Verifier agent definition
│   │   ├── test-architect.md       # Architect agent definition
│   │   └── test-writer.md          # Writer agent definition
│   ├── prompts/
│   │   ├── orb-init.prompt.md
│   │   ├── orb-explore.prompt.md
│   │   ├── orb-verify.prompt.md
│   │   ├── orb-architect.prompt.md
│   │   ├── orb-write-tests.prompt.md
│   │   ├── orb-status.prompt.md
│   │   └── orb-run.prompt.md
│   ├── workflows/
│   │   ├── explore-page.md
│   │   ├── verify-specs.md
│   │   ├── setup-tests.md
│   │   └── write-tests.md
│   └── instructions/
│       └── ouroboros.instructions.md
│
├── src/                              # Everything lives here
│   ├── index.ts                      # Public API exports
│   ├── base/
│   │   └── page.ts                   # BasePage class
│   ├── components/                   # Generic UI components
│   │   ├── table.component.ts
│   │   ├── form.component.ts
│   │   ├── modal.component.ts
│   │   ├── navigation.component.ts
│   │   └── toast.component.ts
│   ├── fixtures/
│   │   ├── base.fixture.ts           # Base test fixture factory
│   │   ├── auth.setup.ts             # Auth setup factory
│   │   ├── data.fixture.ts           # DataManager + lifecycle
│   │   └── test.fixture.ts           # Domain test fixture (generated)
│   ├── helpers/
│   │   ├── api.helper.ts             # Generic CRUD API helper
│   │   ├── assertions.helper.ts      # Generic assertion helpers
│   │   ├── constants.ts              # Constants (framework + domain)
│   │   └── data-factory.ts           # Data factory (base + domain)
│   ├── utils/
│   │   └── config.ts                 # Config loader (.ouroboros/)
│   ├── pages/                        # Domain page objects (generated)
│   │   └── {module}/
│   │       └── {page}.page.ts
│   ├── docs/                         # Domain requirement specs (generated)
│   │   ├── STATE.md
│   │   ├── DOMAIN-TREE.md
│   │   └── {module}/{page}/
│   │       ├── spec.md
│   │       └── sections/{section}/
│   │           ├── spec.md
│   │           └── screenshots/
│   └── tests/                        # Test cases (generated)
│       ├── playwright.config.ts
│       ├── fixtures/
│       │   └── auth.setup.ts
│       └── {module}/{page}/
│           └── {section}.spec.ts
│
├── .ouroboros/                        # Runtime configuration
│   └── config.json
│
├── templates/                        # Scaffolding templates
│   └── config.template.json
│
├── package.json
├── tsconfig.json
├── tsconfig.build.json
└── ARCHITECTURE.md
```

---

## Spec Format

Specs are written in Markdown using **Given/When/Then scenarios** per requirement. Every claim in a spec is directly testable.

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
      "default": { "username": "...", "password": "..." },
      "admin":   { "username": "...", "password": "..." }
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

> **Security:** Add `.ouroboros/config.json` to `.gitignore` if it contains real credentials. Use environment variables for CI:
>
> ```bash
> TC_USERNAME=... TC_PASSWORD=... npm test
> ```

---

## Domain Tree

As the explorer discovers that entities created on one page appear on another, it documents those relationships in `src/docs/DOMAIN-TREE.md`. The test-writer uses this to generate cross-page test cases.

```
users-management/create-form  ──creates──▶  users-management/user-table
users-management/user-table   ──flows──▶    dashboard/recent-activity
settings/roles                ──populates── users-management/create-form (role dropdown)
```

---

## Test Architecture

The `test-architect` agent applies these patterns, all derived from verified specs:

| Pattern | Purpose |
|---------|---------|
| **Page Object Model** | Each page has a class encapsulating its interactions |
| **Component Objects** | Reusable UI components (table, form, modal) shared across pages |
| **Fixture-based DI** | Pages, data, config injected via Playwright fixtures |
| **Data Factory** | Domain-aware test data generators using field definitions from specs |
| **API Helper** | Direct API calls to create/delete test data without UI overhead |
| **Auth via storageState** | Authenticate once per worker; share session across all tests |

```typescript
// All fixtures are auto-injected via test.fixture.ts
import { test, expect } from '../../../fixtures/test.fixture';

test('should create a user', async ({ page, usersPage, dataManager }) => {
  const user = dataManager.generate.user();
  await usersPage.createUser(user);
  await expect(page.getByText(user.firstName)).toBeVisible();
});
```

---

## State Tracking

`src/docs/STATE.md` is the source of truth for progress. Run `/orb-status` at any time to see the dashboard:

```
Ouroboros Tester Dashboard
══════════════════════════════════════════════════

Domain: My App (https://app.example.com)

Pages:
  ● user-management    ████████████░░░░  75%  [3/4 sections explored, 2 verified, 1 tested]
  ● dashboard          ██████░░░░░░░░░░  37%  [2/3 sections explored, 1 verified, 0 tested]
  ○ settings           ░░░░░░░░░░░░░░░░   0%  [not started]

Relationships:
  ✓ user-management/create-form → dashboard/recent-activity
  ○ settings/roles → user-management/create-form (unverified)

Test Infrastructure: ✓ Set up
Tests: 12 written, 10 passing, 2 failing

Next Steps:
  → /orb-explore https://app.example.com/settings --name "Settings"
  → /orb-verify dashboard
  → /orb-write-tests user-management --section user-list
```

---

## Design Principles

- **Spec-first:** Nothing is tested that isn't first documented in a verified spec
- **Goal-backward verification:** Specs are verified by asking "can users actually do this?" not "did the agent write this?"
- **File-based state:** All progress lives in Markdown files — readable, diffable, committable
- **Cross-page awareness:** Data relationships between pages are tracked and tested end-to-end
- **Reuse over duplication:** Components, fixtures, and helpers are designed once from spec patterns and shared across all tests
