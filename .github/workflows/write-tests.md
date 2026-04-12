---
name: write-tests
description: "Orchestrates the test-writer agent to generate Playwright test cases from verified specs"
agents:
  - test-writer
---

# Write Tests Workflow

## Purpose
Generate comprehensive Playwright test suites for verified page specs using established test architecture.

## Prerequisites
- Page specs must be verified (run `/orb-verify` first)
- Test architecture must exist (run `/orb-architect` first)

## Arguments
- `page-slug` (required): Page to write tests for
- `--section` (optional): Specific section to write tests for
- `--type` (optional): create|read|update|delete — only specific CRUD tests
- `--dry-run` (optional): Show planned tests without writing

## Process

<step name="load_context" priority="first">
1. Read `.ouroboros/config.json`
2. Read `.ouroboros/architect-manifest.md` — binding contract from architect
   - If exists → use it
   - Else → discover architecture from `src/` directly: read all files in `src/pages/`, `src/fixtures/`, `src/helpers/`, `src/components/`, `src/base/`
3. Read `.ouroboros/test-map.json` for spec-to-test mapping
4. Read page spec: `src/docs/{module}/{page}/spec.md`
5. Read ALL architecture files listed in manifest (or discovered from source)
6. Read framework base classes in `src/` (base page, components, fixtures, helpers)
7. Read `src/docs/DOMAIN-TREE.md` for cross-page tests
8. **Run spec validation:** `node scripts/validate-spec.mjs src/docs/{module}/{page}/sections/{section}/spec.md`
   - FAILURES → attempt one fix pass (verify with Playwright MCP, correct spec, re-validate). If persist, proceed — test-writer handles via deviation rules.
   - WARNINGS → proceed, note them
</step>

<step name="plan_tests">
For each section (or filtered by --section):
1. Read verified section spec
2. Map each requirement to test case(s)
3. Map each scenario to test step(s)
4. Identify test data needs — verify DataFactory generates compliant data
5. Identify cross-page test scenarios
6. **Verify POM has methods for every interaction** — if not, update POM before writing tests
7. If `--dry-run`: output test plan and stop
</step>

<step name="write_test_files">
For each section, spawn test-writer agent to generate:
1. `src/tests/{module}/{page}/{section-slug}.spec.ts` — main test file
2. Update `src/helpers/data-factory.ts` if new entity types needed
3. Update page POM in `src/pages/` if new methods needed

**Test file quality gates:**
- Must NOT import anything except `fixtures/test.fixture`, `helpers/data-factory`, `helpers/constants`
- Must NOT contain raw `page.locator()` or `page.getByRole()` — only POM method calls
- Must NOT contain hardcoded URLs or `page.request.*` calls
- Must NOT contain `scrollIntoViewIfNeeded()` — POM handles this
- Must NOT define standalone helpers duplicating POM methods
</step>

<step name="validate_tests">
1. TypeScript check: `npx tsc --noEmit`
2. Fix type errors
3. Run tests: `npx playwright test src/tests/{module}/{page}/`
4. If failures, follow Failure Diagnosis Protocol (defined in test-writer agent):
   a. Classify failure (locator timeout, assertion failure, type error, navigation error)
   b. Cross-reference with spec's Interaction Recipe for failing interaction
   c. Use browser MCP to diagnose (snapshot to file, check element state)
   d. Fix root cause — update POM if doesn't match recipe, update assertion if doesn't match Assert
   e. Max 3 iterations per failing test. After 3:
      - Skip with `test.skip('BLOCKED: [reason]')` and `<!-- BLOCKED -->` comment
      - **Continue with remaining tests** — do NOT halt suite
      - Include in completion report

**Architecture bug classification:**

| Symptom | Root Cause | Owner |
|---------|-----------|-------|
| POM method inaccessible (protected/private) | Access modifiers too restrictive | test-architect |
| API returns 401/403 | Auth propagation broken | test-architect |
| API returns 400 with field errors | Payload format mismatch | test-architect + spec-verifier |
| Fixture destructuring fails | Fixture chain broken | test-architect |
| Locator timeout on documented container | Container type misidentified | crawl-explorer + spec-verifier |
| Assertion fails on feedback element | Feedback mechanism wrong in spec | spec-verifier |
| Test logic error, wrong assertion, missing await | Test bug | test-writer (fix locally) |

**For architecture-origin bugs**: Fix to unblock, document every fix:
```typescript
// ARCHITECTURE GAP: [description]
// Original assumption: [what manifest/POM/helper had]
// Actual behavior: [what app actually does]
```

5. Re-run until green or max iterations reached
</step>

<step name="update_state">
1. Update `src/docs/STATE.md`: tests written count, pass/fail, coverage
2. Update `.ouroboros/test-map.json` with actual test file paths
3. Suggest next: `/orb-write-tests {next-page-slug}`
</step>
