---
name: verify-specs
description: "Orchestrates the spec-verifier agent to validate specs produced by the explorer"
agents:
  - spec-verifier
---

# Verify Specs Workflow

## Purpose
Re-crawl documented pages/sections to verify spec accuracy, fix inaccuracies, and mark specs as verified.

## Prerequisites
- Page specs must exist (run `/tc:explore` first)
- Browser MCP connection must be active

## Arguments
- `page-slug` (required): The page to verify
- `--section` (optional): Specific section to verify. If omitted, verifies all sections.
- `--auth` (optional): If set, performs authentication before verifying

## Process

<step name="load_context" priority="first">
1. Read `.ouroboros/config.json`
2. Read `src/docs/{module}/{page}/spec.md`
3. List all sections under `src/docs/{module}/{page}/sections/`
4. Read `src/docs/DOMAIN-TREE.md` for relationship verification
</step>

<step name="authenticate" condition="--auth is set">
1. Check for existing storage state at `playwright/.auth/storage-state.json`
2. If valid, reuse. If expired, re-authenticate.
</step>

<step name="verify_each_section">
For each section (or filtered by --section):
1. Read section spec from `src/docs/{module}/{page}/sections/{section-slug}/spec.md`
2. Read section impl from `src/docs/{module}/{page}/sections/{section-slug}/impl.md`
3. Navigate to the page and locate the section
4. Spawn spec-verifier agent with both files and page context
5. Agent performs recipe re-execution (reproduces every Interaction Recipe)
6. Agent performs structural verification (CRUD, elements, containers, scenarios)
7. Agent verifies API contracts via `api-probe verify-contract`
8. Agent runs flow simulation (Create → Edit → Delete without refresh)
9. Agent updates spec with verification status

**REJECTION CHECK:** Before marking verified, agent MUST confirm NONE of the rejection criteria are met (see spec-verifier agent). If any are met, agent fills in the missing data and marks `corrected: true`.
</step>

<step name="verify_relationships">
1. Read relationships from `src/docs/DOMAIN-TREE.md`
2. For each relationship involving this page:
   - Navigate to source page, create test entity
   - Navigate to target page, verify entity appears
   - Update relationship status in domain tree
</step>

<step name="generate_report">
1. Compile verification results per section
2. Calculate accuracy score: verified / total requirements
3. List corrections made
4. List missing items added
5. **Run spec validation:** `node scripts/validate-spec.mjs --all`
   - If failures remain after verification, the verifier MUST fix them before marking verified
   - The validation script catches structural gaps the verifier may have missed
6. Update `src/docs/STATE.md` with verification status
</step>

<step name="route_next">
If all sections verified:
  → Suggest: `/tc:architect` to set up test infrastructure
  → Suggest: `/tc:write-tests {page-slug}` to write tests

If some sections failed:
  → Suggest: `/tc:explore {url} --sections {failed-sections}` to re-explore
</step>
