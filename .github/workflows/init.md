---
name: init
description: "Initializes Ouroboros Tester for a new domain: config, templates, and state tracking"
---

# Initialize Ouroboros Tester Workflow

## Purpose
Set up the `.ouroboros/` directory and `src/docs/` with configuration, templates, and initial state for automated domain testing.

## Arguments
- `base-url` (required): Root URL of the website to test
- `--name` (optional): Human-readable project name

## Process

<step name="gather_info">
Ask the user for any details not provided in arguments:
1. **Base URL** — Root URL of the website (e.g., `https://app.example.com`)
2. **Project Name** — Human-readable name (e.g., "Example CRM")
3. **Authentication** — Does the site require login?
   - If yes: Login URL, username, password
   - Credentials go in config (add `.ouroboros/config.json` to `.gitignore`)
4. **Roles** — Are there multiple user roles to test? (admin, user, etc.)
5. **API Base URL** — If there's an API for test data setup (optional)
</step>

<step name="create_directories">
Create the following (skip if already exists):
```
.ouroboros/
├── config.json
└── screenshots/
    └── .gitkeep
src/docs/
├── STATE.md
├── DOMAIN-TREE.md
└── .gitkeep
```
</step>

<step name="create_config">
Write `.ouroboros/config.json` using the template at `templates/config.template.json` as a reference. Fill in gathered information.
</step>

<step name="initialize_state">
Write initial `src/docs/STATE.md`:
```markdown
# Ouroboros Tester — State

**Domain:** {project-name}
**Base URL:** {base-url}
**Initialized:** {today's date}

## Pages

| Page | Slug | Sections | Explored | Verified | Tests Written |
|------|------|----------|----------|----------|---------------|

## Test Infrastructure
- Architecture set up: No

## Notes
```

Write initial `src/docs/DOMAIN-TREE.md`:
```markdown
# Domain Tree — {project-name}

## Entity Relationships

No relationships documented yet. Run `/tc-explore` to start.
```
</step>

<step name="verify_gitignore">
Ensure `.ouroboros/config.json` and `playwright/.auth/` are in `.gitignore`.
</step>

<step name="report">
Confirm initialization is complete and suggest the next step:
→ `/tc-explore <first-page-url> --name "<Page Name>" --auth`
</step>
