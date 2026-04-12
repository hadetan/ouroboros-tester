---
name: init
description: "Initializes Ouroboros Tester for a new domain: config, templates, and state tracking"
---

# Initialize Ouroboros Tester Workflow

## Purpose
Set up `.ouroboros/` and `src/docs/` with configuration, templates, and initial state.

## Arguments
- `base-url` (required): Root URL of website to test
- `--name` (optional): Human-readable project name

## Process

<step name="gather_info">
Ask user for details not in arguments:
1. **Base URL** — Root URL (e.g., `https://app.example.com`)
2. **Project Name** — Human-readable name (e.g., "Example CRM")
3. **Authentication** — Login required? If yes: login URL, username, password (credentials go in config, gitignored)
4. **Roles** — Multiple user roles? (admin, user, etc.)
5. **API Base URL** — For test data setup (optional)
</step>

<step name="create_directories">
Create the following (skip if already exists):
```
.ouroboros/
├── config.json
└── testing-scope.md
src/docs/
├── STATE.md
├── DOMAIN-TREE.md
└── .gitkeep
```
</step>

<step name="create_config">
Write `.ouroboros/config.json` using `templates/config.template.json` as reference. Fill in gathered info.

Write `.ouroboros/testing-scope.md` from `templates/testing-scope.md`. Copy as-is — user edits later to customize scope.
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

No relationships documented yet. Run `/orb-explore` to start.
```
</step>

<step name="verify_gitignore">
Ensure `.ouroboros/config.json` and `playwright/.auth/` are in `.gitignore`.
</step>

<step name="report">
Confirm initialization complete. Suggest next step:
→ `/orb-explore <first-page-url> --name "<Page Name>" --auth`

Mention: Edit `.ouroboros/testing-scope.md` to customize what agents test or skip.
</step>
