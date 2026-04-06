---
description: "Show the current status of domain exploration, spec verification, and test writing"
argument-hint: "[--page <page-slug>]"
agent: "agent"
---

# Ouroboros Tester Status

## Objective
Display a dashboard showing the progress of exploration, verification, and test writing across all pages and sections.

## Process

1. Read `src/docs/STATE.md`
2. Read all page specs from `src/docs/`
3. Read `src/docs/DOMAIN-TREE.md` for relationship status

### Display Format

```
Ouroboros Tester Dashboard
══════════════════════════════════════════════════

Domain: {project-name} ({base-url})

Pages:
  ● users-management     ████████████░░░░  75%  [3/4 sections explored, 2 verified, 1 tested]
  ● dashboard             ██████░░░░░░░░░░  37%  [2/3 sections explored, 1 verified, 0 tested]
  ○ settings              ░░░░░░░░░░░░░░░░   0%  [not started]

Relationships:
  ✓ users-management/user-form → dashboard/recent-activity
  ○ settings/roles → users-management/user-form (unverified)

Test Infrastructure: ✓ Set up
Tests: 12 written, 10 passing, 2 failing

Next Steps:
  → /tc-explore https://app.example.com/settings --name "Settings"
  → /tc-verify dashboard
  → /tc-write-tests users-management --section user-list
```
