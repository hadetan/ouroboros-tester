---
name: verify-specs
description: "Orchestrates the spec-verifier agent to validate specs produced by the explorer"
agents:
  - spec-verifier
---

# Verify Specs Workflow

## Purpose
Re-crawl documented pages/sections, verify spec accuracy, fix inaccuracies, mark verified.

## Prerequisites
- Page specs must exist (run `/orb-explore` first)
- Browser MCP connection active

## Arguments
- `page-slug` (required): Page to verify
- `--section` (optional): Specific section. If omitted, verifies all.
- `--auth` (optional): Authenticate before verifying

## Process

<step name="load_context" priority="first">
1. Read `.ouroboros/config.json`
2. Read `src/docs/{module}/{page}/spec.md`
3. List all sections under `src/docs/{module}/{page}/sections/`
4. Read `src/docs/DOMAIN-TREE.md` for relationship verification
</step>

<step name="authenticate" condition="--auth is set">
1. Check existing storage state at `playwright/.auth/storage-state.json`
2. If valid, reuse. If expired, re-authenticate.
</step>

<step name="verify_each_section">
For each section (or filtered by --section):
1. Read `spec.md` + `impl.md` from `src/docs/{module}/{page}/sections/{section-slug}/`
2. Navigate to page, locate section
3. Spawn spec-verifier agent with both files and page context
4. Agent re-executes every Interaction Recipe
5. Agent performs structural verification (CRUD, elements, containers, scenarios)
6. Agent verifies API contracts via `api-probe verify-contract`
7. Agent runs flow simulation (Create → Edit → Delete without refresh)
8. Agent updates spec with verification status

**REJECTION CHECK:** Before marking verified, agent MUST confirm NONE of rejection criteria met (see spec-verifier agent). If any met, agent fills missing data and marks `corrected: true`.
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
3. List corrections and missing items added
4. **Run spec validation:** `node scripts/validate-spec.mjs --all`
   - Failures after verification → verifier MUST fix before marking verified
5. Update `src/docs/STATE.md` with verification status
</step>

<step name="route_next">
If all sections verified:
  → Suggest: `/orb-architect` to set up test infrastructure
  → Suggest: `/orb-write-tests {page-slug}` to write tests

If some sections failed:
  → Suggest: `/orb-explore {url} --sections {failed-sections}` to re-explore
</step>
