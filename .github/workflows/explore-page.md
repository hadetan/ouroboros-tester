---
name: explore-page
description: "Orchestrates the crawl-explorer agent to discover and document a page's sections and CRUD operations"
agents:
  - crawl-explorer
---

# Explore Page Workflow

## Purpose
Navigate to a target page, discover all sections, understand CRUD operations, and produce structured specs.

## Prerequisites
- `.ouroboros/config.json` must exist (run `/orb-init` first)
- Browser MCP connection must be active

## Arguments
- `url` (required): The URL of the page to explore
- `page-name` (required): Human-readable name for the page
- `--sections` (optional): Comma-separated list of specific sections to explore
- `--auth` (optional): If set, performs authentication before exploring

## Process

<step name="validate_config" priority="first">
1. Read `.ouroboros/config.json`
2. Verify the target URL belongs to the configured domain
3. If `--auth` is set, verify credentials exist in config
</step>

<step name="authenticate" condition="--auth is set">
1. Read auth config from `.ouroboros/config.json`
2. Navigate to login URL
3. Fill credentials using `mcp_microsoft_pla_browser_fill_form`
4. Wait for authentication to complete
5. Save storage state to `playwright/.auth/storage-state.json`
</step>

<step name="create_page_scaffold">
1. Generate page slug from page-name (kebab-case)
2. Parse URL path into folder hierarchy (e.g., `/CategoryName/SubPage` → `category-name/sub-page/`). Query-param tabs become sections, not separate pages.
3. Create directory: `src/docs/{module}/{page}/sections/`
4. Create initial page spec from `templates/page-spec.md`
5. Update `src/docs/STATE.md` with new page entry
</step>

<step name="discover_sections">
1. Navigate to the target URL
2. Capture the actual browser URL after navigation (server may redirect)
3. Take accessibility snapshot and screenshot
4. Identify distinct sections on the page
5. Create section directories for each
6. Update page spec with section list
</step>

<step name="explore_each_section">
For each section (or filtered by --sections):

1. Crawl-explorer agent explores the section following its full process
2. Agent writes section files to disk BEFORE moving to next section:
   - `src/docs/{module}/{page}/sections/{section-slug}/spec.md`
   - `src/docs/{module}/{page}/sections/{section-slug}/impl.md`
3. Update page spec with section completion status

**Checkpoint before marking explored:**
- `spec.md`: Section Info with App URL Path, Requirements with G/W/T scenarios, States
- `impl.md`: UI Framework details, Interaction Recipes with Assert fields, Form Fields with validation rules, API Contracts, Mutation Side Effects, Feedback Mechanisms
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
1. Mark page exploration as complete in `src/docs/STATE.md`
2. Report summary: sections found, CRUD operations documented, relationships detected
</step>
