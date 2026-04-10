---
name: status
description: "Shows the current status dashboard for domain exploration, spec verification, and test writing"
---

# Status Dashboard Workflow

## Purpose
Display a progress dashboard across all pages and sections.

## Arguments
- `--page` (optional): Show detailed status for a specific page slug only

## Process

<step name="read_state" priority="first">
1. Read `src/docs/STATE.md`
2. Glob all page specs from `src/docs/**/*.md`
3. Read `src/docs/DOMAIN-TREE.md` for relationship status
4. Check if `.ouroboros/architect-manifest.md` exists (indicates architecture is set up)
5. Count test files in `src/tests/` and check pass/fail:
   ```bash
   npx playwright test --reporter=json 2>/dev/null | head -5
   ```
   (Skip if no test infrastructure)
</step>

<step name="display">
Output a dashboard in this format:

```
Ouroboros Tester Dashboard
══════════════════════════════════════════════════

Domain: {project-name} ({base-url})

Pages:
  ● {page-slug}  ████████████░░░░  75%  [3/4 sections explored, 2 verified, 1 tested]
  ○ {page-slug}  ░░░░░░░░░░░░░░░░   0%  [not started]

Relationships:
  ✓ {source-page}/{section} → {target-page}/{section}
  ○ {unverified relationship}

Test Infrastructure: ✓ Set up  (or: ✗ Not set up — run /orb-architect)
Tests: {n} written, {n} passing, {n} failing

Next Steps:
  → {suggested command based on current state}
```

If `--page` is provided, show detailed status for that page only, including per-section status.
</step>
