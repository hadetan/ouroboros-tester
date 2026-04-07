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
- `.ouroboros/config.json` must exist (run `/tc-init` first)
- Browser MCP connection must be active

## Arguments
- `url` (required): The URL of the page to explore
- `page-name` (required): Human-readable name for the page (e.g., "Users Management")
- `--sections` (optional): Comma-separated list of specific sections to explore. If omitted, explores all.
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
2. Parse URL path segments into hierarchical folder path (e.g., `/CategoryName/SubPage` → `category-name/sub-page/`). If the URL uses `?tab=` query params, each tab becomes a section within the page folder, NOT a separate page.
3. Create directory: `src/docs/{module}/{page}/`
4. Create directory: `src/docs/{module}/{page}/sections/`
5. Create initial page spec from template: `templates/page-spec.md`
6. Update `src/docs/STATE.md` with new page entry
</step>

<step name="discover_sections">
1. Navigate to the target URL
2. **Capture the actual browser URL** after navigation completes (the server may redirect or rewrite the URL):
   ```js
   // Run via browser_evaluate after navigation
   window.location.pathname + window.location.search
   ```
   Record this as the **App URL Path** — write it into the page spec's `## Page Info` and each section spec's `## Section Info`.
3. Take accessibility snapshot via `mcp_microsoft_pla_browser_snapshot`
4. Take screenshot via `mcp_microsoft_pla_browser_take_screenshot`
5. Analyze the snapshot to identify distinct sections
6. Create section directory for each discovered section
7. Update page spec with section list
</step>

<step name="explore_each_section">
For each section (or filtered by --sections):
1. Spawn crawl-explorer agent with section context
2. Agent performs UI Framework Identification (Phase 2) FIRST
3. Agent performs ARIA & Locator Audit (Phase 3)
4. Agent performs CRUD analysis on the section (Phase 4)
5. Agent documents Mutation Side Effects (Phase 5)
6. Agent writes section spec to `src/docs/{module}/{page}/sections/{section-slug}/spec.md`
7. Agent captures screenshots to `src/docs/{module}/{page}/sections/{section-slug}/screenshots/`
8. Update page spec with section completion status

**CHECKPOINT:** Before marking a section as explored, verify the spec contains:
- [ ] `## Section Info` — **App URL Path** is filled with exact browser path (not guessed from nav menu)
- [ ] `## UI Framework & Component Details` — all tables filled
- [ ] `### Accessibility & Locator Notes` — at least one row per interactive component
- [ ] `### Layout Constraints` — viewport and modal overflow documented
- [ ] `## Form Fields` — validation column has format rules, not just "required"
- [ ] `## API Contracts` — one row per CRUD endpoint with actual response shapes and auth mechanism
- [ ] `### Field Name Mappings` — UI label → API field name for any mismatches (especially dropdowns with UUIDs)
- [ ] `## Mutation Side Effects` — one row per CRUD operation with explicit filter/pagination/alert columns
- [ ] `## Feedback Mechanisms` — one row per operation with exact locator and Assertion Command (no generic "toast")
- [ ] `## Interaction Recipes` — one recipe per distinct interaction, each with Assert and Signal fields
- [ ] `## Create vs Edit Form Differences` — filled if section has both create and edit forms
- [ ] `## Concurrency & Timing Notes` — filled if section has mutations
- [ ] No "Not fully explored" or "Requires follow-up" text anywhere in the spec
</step>

<step name="validate_specs">
After all sections are explored, run the spec validation script:
1. Execute: `node scripts/validate-spec.mjs --all`
2. If any failures: fix the specs before proceeding
3. If only warnings: review and address if possible
4. The validation script checks all completeness requirements automatically
</step>

<step name="detect_relationships">
1. Review all entity types discovered across sections
2. Check if any entities appear on previously documented pages
3. If cross-page relationships found:
   - Update `src/docs/DOMAIN-TREE.md` with the relationship
   - Update affected spec files with relationship references
</step>

<step name="update_state">
1. Mark page exploration as complete in `src/docs/STATE.md`
2. Report summary: sections found, CRUD operations documented, relationships detected
3. Suggest next steps: `/tc:verify {page-slug}` or `/tc:explore {next-url}`
</step>
