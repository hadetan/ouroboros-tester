# Ouroboros Tester — AI-Driven Domain Test Automation

## Architecture Overview

Ouroboros Tester is a spec-driven test automation framework that uses AI agents with Playwright MCP to explore, document, verify, and generate tests for any web application. Everything lives inside `src/` — the framework, domain code, specs, and tests.

### Design Philosophy

The `src/` directory is the single source of truth. It contains the framework (base classes, components, fixtures, helpers), domain page objects, domain documentation (requirement specs), and test cases. Nothing lives outside of it except configuration and build tooling.

```
┌─────────────────────────────────────────────────────────────┐
│  ouroboros-tester                                           │
│                                                             │
│  src/                        ← Everything lives here        │
│  ├── base/page.ts            ← BasePage class               │
│  ├── components/             ← Generic UI components        │
│  ├── fixtures/               ← Fixture factories            │
│  ├── helpers/                ← Constants, data-factory, API │
│  ├── utils/config.ts         ← Config loader (.ouroboros/)  │
│  ├── pages/                  ← Domain page objects (POMs)   │
│  │   └── {module}/{page}.page.ts                            │
│  ├── docs/                   ← Domain requirement specs     │
│  │   ├── STATE.md            ← Progress tracking            │
│  │   ├── DOMAIN-TREE.md      ← Cross-page relationships    │
│  │   └── {module}/{page}/    ← Page & section specs         │
│  └── tests/                  ← Test cases + config          │
│      ├── playwright.config.ts                               │
│      ├── fixtures/auth.setup.ts                             │
│      └── {module}/{page}/    ← Test files (*.spec.ts)       │
│                                                             │
│  .ouroboros/                 ← Runtime config                │
│  ├── config.json                                            │
│  └── test-map.json                                          │
└─────────────────────────────────────────────────────────────┘
```

### URL-Based Folder Hierarchy

Pages and tests mirror the application's URL path structure. Each URL path segment is converted to kebab-case. Query-parameter tabs (`?tab=X`) are treated as sections within the page folder, not separate pages.

```
URL: /CategoryName/SubPage
  → src/pages/category-name/sub-page.page.ts
  → src/docs/category-name/sub-page/spec.md
  → src/docs/category-name/sub-page/sections/{section}/spec.md
  → src/tests/category-name/sub-page/{section}.spec.ts

URL: /CategoryName/SubPage?tab=listing  &  ?tab=settings
  → both tabs are sections under: src/docs/category-name/sub-page/sections/
```

### System Design

Inspired by [GSD](https://github.com/coleam00/get-shit-done)'s agent orchestration + file-based state, and [OpenSpec](https://github.com/openspec-dev/openspec)'s spec-driven development.

```
┌────────────────────────────────────────────────────────────────┐
│                          USER                                  │
│              /orb-init  /orb-explore  /orb-verify                 │
│              /orb-architect  /orb-write-tests  /orb-run           │
└──────────────────────────┬─────────────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────────────┐
│                    COMMAND LAYER                                │
│            .github/prompts/orb-*.prompt.md                      │
└──────────────────────────┬─────────────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────────────┐
│                   WORKFLOW LAYER                                │
│            .github/workflows/*.md                              │
│   Orchestrate agents, manage state, route next steps           │
└──────┬──────────────┬───────────────┬──────────────────────────┘
       │              │               │
┌──────▼──────┐ ┌─────▼─────┐ ┌──────▼──────┐ ┌────────────────┐
│ crawl-      │ │ spec-     │ │ test-       │ │ test-          │
│ explorer    │ │ verifier  │ │ architect   │ │ writer         │
│ (Playwright │ │ (Verify   │ │ (Create POM,│ │ (Write tests   │
│  MCP crawl) │ │  specs)   │ │  fixtures)  │ │  from specs)   │
└──────┬──────┘ └─────┬─────┘ └──────┬──────┘ └───────┬────────┘
       │              │               │                │
┌──────▼──────────────▼───────────────▼────────────────▼────────┐
│                  FILE SYSTEM                                   │
│  .ouroboros/config.json │ src/docs/ │ src/pages/ │ src/tests/  │
└────────────────────────────────────────────────────────────────┘
```

### Agent Pipeline

```
/orb-explore     →  crawl-explorer  →  Page & section specs (src/docs/)
/orb-verify      →  spec-verifier   →  Verified specs (src/docs/)
/orb-architect   →  test-architect  →  POM (src/pages/) + fixtures (src/fixtures/)
/orb-write-tests →  test-writer     →  Test files (src/tests/{module}/{page}/)
/orb-run         →  all above       →  Full pipeline
```

### Key Patterns

| Pattern | Inspired By | Implementation |
|---------|-------------|----------------|
| Agent frontmatter | GSD | `.github/agents/*.md` with name, description, tools |
| File-based state | GSD | `src/docs/STATE.md` tracking progress |
| Spec format | OpenSpec | Requirements + Given/When/Then scenarios |
| Domain tree | OpenSpec | Cross-page entity relationship mapping |
| Workflows | GSD | Multi-step orchestration in `.github/workflows/` |
| Commands | GSD | User-facing entry points in `.github/prompts/orb-*.prompt.md` |
| Package exports | OpenSpec | `src/` builds to `dist/`, publishable as npm package |

### Test Architecture Patterns

| Pattern | Purpose |
|---------|---------|
| Page Object Model | Encapsulate page interactions in reusable classes |
| Fixture-based DI | Inject pages, data, config via Playwright fixtures |
| Component Objects | Reusable UI component abstractions (table, form, modal) |
| Data Factory | Generated test data with unique values |
| API Helper | Direct backend calls for fast setup/teardown |
| Auth via storageState | Authenticate once, share across workers |
| Worker-scoped config | Load config once per Playwright worker |

### Directory Structure

```
ouroboros-tester/
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
│   ├── config.template.json
│   ├── page-spec.md
│   ├── section-spec.md
│   ├── section-crud.md
│   ├── STATE.md
│   └── DOMAIN-TREE.md
│
├── .github/
│   ├── agents/                       # Agent definitions
│   ├── prompts/                      # User commands
│   ├── workflows/                    # Workflow orchestration
│   └── instructions/
│
├── package.json
├── tsconfig.json
├── tsconfig.build.json
└── ARCHITECTURE.md
```

### Import Conventions

Test files import everything from `src/`:
```typescript
// In src/tests/{module}/{page}/{section}.spec.ts
import { test, expect } from '../../../src/fixtures/test.fixture';
import { DataFactory } from '../../../src/helpers/data-factory';
import { VALIDATION } from '../../../src/helpers/constants';
```

Page objects import from sibling `src/` modules:
```typescript
// In src/pages/{module}/{page}.page.ts
import { BasePage } from '../../base/page';
import { ROUTES } from '../../helpers/constants';
```
