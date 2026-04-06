---
description: "Initialize Ouroboros Tester for a new domain. Sets up config, templates, and state tracking."
argument-hint: "<base-url> [--name <project-name>]"
agent: "agent"
---

# Initialize Ouroboros Tester

## Objective
Set up the `.ouroboros/` directory and `src/docs/` with configuration, templates, and initial state for automated domain testing.

## Process

### Step 1: Gather Information
Ask the user for:
1. **Base URL** — The root URL of the website to test (e.g., `https://app.example.com`)
2. **Project Name** — Human-readable name (e.g., "Example CRM")
3. **Authentication** — Does the site require login?
   - If yes: Login URL, username field selector hint, password field selector hint
   - Credentials (stored in config, added to .gitignore)
4. **Roles** — Are there multiple user roles to test? (admin, user, etc.)
5. **API Base URL** — If there's an API for test data setup (optional)

### Step 2: Create Directory Structure
```
.ouroboros/
├── config.json
└── screenshots/
    └── .gitkeep
src/docs/
├── STATE.md
├── DOMAIN-TREE.md
└── .gitkeep
templates/
├── page-spec.md
├── section-spec.md
└── section-crud.md
```

### Step 3: Create Config
Write `.ouroboros/config.json` with gathered information.

### Step 4: Create Templates
Write all template files from the templates defined below.

### Step 5: Initialize State
Write initial `src/docs/STATE.md` with project metadata.
