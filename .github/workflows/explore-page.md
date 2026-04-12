---
name: explore-page
description: "Orchestrates the crawl-explorer agent to discover and document a page's sections and CRUD operations"
agents:
  - crawl-explorer
---

# Explore Page Workflow

## Purpose
Navigate to target page, discover sections, document CRUD operations, produce structured specs.

## Prerequisites
- `.ouroboros/config.json` must exist (run `/orb-init` first)
- Browser MCP connection active

## Arguments
- `url` (required): Page URL to explore
- `page-name` (required): Human-readable page name
- `--sections` (optional): Comma-separated section list to explore
- `--auth` (optional): Authenticate before exploring

## Process

<step name="validate_config" priority="first">
1. Read `.ouroboros/config.json`
2. Verify target URL belongs to configured domain
3. If `--auth` set, verify credentials exist
</step>

<step name="authenticate" condition="--auth is set">
1. Read auth config from `.ouroboros/config.json`
2. Navigate to login URL
3. Fill credentials using `mcp_microsoft_pla_browser_fill_form`
4. Wait for auth completion
5. Save storage state to `playwright/.auth/storage-state.json`
</step>

<step name="create_page_scaffold">
1. Generate page slug (kebab-case)
2. Parse URL path into folder hierarchy (`/CategoryName/SubPage` → `category-name/sub-page/`). Query-param tabs → sections, not separate pages.
3. Create directory: `src/docs/{module}/{page}/sections/`
4. Create initial page spec from `templates/page-spec.md`
5. Update `src/docs/STATE.md` with new page entry
</step>

<step name="read_scope">
1. Read `.ouroboros/testing-scope.md` if it exists
2. Determine which operations and interaction types are in scope
3. Pass scope constraints to crawl-explorer — agent skips out-of-scope interactions
</step>

<step name="discover_sections">
1. Navigate to target URL
2. Capture actual browser URL after navigation (server may redirect)
3. Take accessibility snapshot to file (`playwright/trash/snapshot.md`, depth: 4)
4. Read snapshot to identify distinct sections
5. If page has multiple views (tabs, toggles): record all view names. Stay on the active view — do NOT click other views.
6. List all sections visible in the active view. These are the sections to explore in this run.
7. Create section directories for current-view sections only
8. Update page spec with full view/section inventory (mark which views remain unexplored)
</step>

<step name="explore_each_section">
For each section in the active view (or filtered by --sections):

1. Complete ALL sections in the current view. Run full CRUD cycle per section before moving to the next section. Never skip a section to explore a different view.
2. Agent writes section files to disk BEFORE moving to next section:
   - `src/docs/{module}/{page}/sections/{section-slug}/spec.md`
   - `src/docs/{module}/{page}/sections/{section-slug}/impl.md`
3. Update page spec with section completion status

**Scope enforcement:**
- Only explore operations listed in "What to test" (or all CRUD if scope is empty)
- Skip every interaction type listed in "What not to test"
- Feedback signals (toasts, banners) are documented as CRUD operation signals, not standalone features

**Required before marking explored:**
- `spec.md`: Section Info with App URL Path, Requirements with G/W/T scenarios for scoped operations only
- `impl.md`: UI Framework details, Interaction Recipes with Assert fields for scoped operations, Form Fields (types/labels), API Contracts, Mutation Side Effects, Feedback Mechanisms
- All interactions tested with Playwright native actions (not synthetic events)
- Grid inline creation tested if applicable (Phase 3 of crawl-explorer)
</step>

<step name="validate_specs">
After all sections explored:
1. Execute: `node scripts/validate-spec.mjs --all`
2. Fix any failures before proceeding
</step>

<step name="detect_relationships">
1. Review entity types discovered across sections
2. Check if any appear on previously documented pages
3. **Update `src/docs/DOMAIN-TREE.md`** with all discovered relationships
4. Update affected spec files with cross-page references
</step>

<step name="update_state">
1. Update `src/docs/STATE.md` — mark explored sections complete. Only mark the page complete when ALL views are explored.
2. Report summary:
   - Sections explored in this run, CRUD operations documented, relationships detected
   - **Unexplored views** (if any): list each with the command to run next, e.g.:
     ```
     Remaining: /orb-explore <url> --name "<name>" --sections <view-slug>
     ```
</step>
