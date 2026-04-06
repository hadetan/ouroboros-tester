---
name: write-tests
description: "Orchestrates the test-writer agent to generate Playwright test cases from verified specs"
agents:
  - test-writer
---

# Write Tests Workflow

## Purpose
Generate comprehensive Playwright test suites for verified page specs using the established test architecture.

## Prerequisites
- Page specs must be verified (run `/tc:verify` first)
- Test architecture must exist (run `/tc:architect` first)

## Arguments
- `page-slug` (required): The page to write tests for
- `--section` (optional): Specific section to write tests for
- `--type` (optional): create|read|update|delete — only generate specific CRUD tests
- `--dry-run` (optional): Show planned tests without writing

## Process

<step name="load_context" priority="first">
1. Read `.ouroboros/config.json`
2. Read `.ouroboros/architect-manifest.md` — **this is the binding contract from the architect. If this file does not exist, STOP and tell the user to run `/tc-architect` first.**
3. Read `.ouroboros/test-map.json` for spec-to-test mapping
4. Read page spec: `src/docs/{module}/{page}/spec.md`
5. Read ALL architecture files listed in the manifest: every POM, fixture, helper, constant file
6. Read framework base classes in `src/` (base page, components, fixtures, helpers)
7. Read `src/docs/DOMAIN-TREE.md` for cross-page tests
8. **Run spec validation:** `node scripts/validate-spec.mjs src/docs/{module}/{page}/sections/{section}/spec.md`
   - If the spec has FAILURES, STOP and tell the user to run `/tc-verify` first
   - If the spec has only WARNINGS, proceed but note them
</step>

<step name="plan_tests">
For each section (or filtered by --section):
1. Read verified section spec
2. Map each requirement to test case(s)
3. Map each scenario to test step(s)
4. Identify test data needs — verify DataFactory generates compliant data
5. Identify cross-page test scenarios
6. **Verify the POM has methods for every interaction** — if not, update the POM before writing tests
7. If `--dry-run`: output test plan and stop
</step>

<step name="write_test_files">
For each section, spawn test-writer agent to generate:
1. `src/tests/{module}/{page}/{section-slug}.spec.ts` — main test file
2. Update `src/helpers/data-factory.ts` if new entity types needed
3. Update page POM in `src/pages/` if new methods needed

**Test file quality gates:**
- Spec file must NOT import anything except `fixtures/test.fixture`, `helpers/data-factory`, and `helpers/constants`
- Spec file must NOT contain raw `page.locator()` or `page.getByRole()` — only POM method calls
- Spec file must NOT contain hardcoded URLs or `page.request.*` calls
- Spec file must NOT contain `scrollIntoViewIfNeeded()` — the POM handles this
- Spec file must NOT define standalone helper functions that duplicate POM methods
</step>

<step name="validate_tests">
1. Run TypeScript compiler check: `npx tsc --noEmit`
2. Fix any type errors
3. Run the generated tests: `npx playwright test src/tests/{module}/{page}/`
4. If failures occur, follow the Failure Diagnosis Protocol (defined in test-writer agent):
   a. Classify each failure (locator timeout, assertion failure, type error, navigation error)
   b. Cross-reference with the spec's Interaction Recipe for the failing interaction
   c. Use browser MCP to diagnose (take snapshot, check element state)
   d. Fix the root cause — update POM if it doesn't match recipe, update assertion if it doesn't match Assertion Command
   e. Max 3 iterations per failing test. After 3 iterations, STOP and report:
      - The exact error
      - What the spec says vs what the page shows
      - Which upstream agent (explorer or architect) needs to fix what

**Architecture bug classification — distinguish test bugs from upstream bugs:**
When a failure occurs, determine its origin before fixing:

| Symptom | Root Cause | Owner |
|---------|-----------|-------|
| POM method or property inaccessible (protected/private) | Architecture gap — access modifiers too restrictive | test-architect |
| API call returns 401/403 | Auth propagation broken in API helper | test-architect |
| API call returns 400 with field errors | Payload format doesn't match actual API contract | test-architect + spec-verifier |
| Fixture destructuring fails (property undefined) | Fixture composition chain broken | test-architect |
| Locator timeout on a container the spec documents | Container type misidentified in spec | crawl-explorer + spec-verifier |
| Assertion fails because feedback element doesn't match | Feedback mechanism wrong in spec | spec-verifier |
| Test logic error, wrong assertion, missing await | Test bug | test-writer (fix locally) |

**For architecture-origin bugs**: Fix them to unblock yourself, but document every fix as a comment block at the top of the affected file:
```typescript
// ARCHITECTURE GAP: [description of what was wrong and what was fixed]
// Original architect assumption: [what the manifest/POM/helper had]
// Actual behavior: [what the app actually does]
```
This creates a traceable record that improves future architect agent runs.

5. Re-run until green or max iterations reached
</step>

<step name="update_state">
1. Update `src/docs/STATE.md` with:
   - Tests written count per section
   - Pass/fail status
   - Coverage: requirements tested / total requirements
2. Update `.ouroboros/test-map.json` with actual test file paths
3. Suggest next page: `/tc:write-tests {next-page-slug}`
</step>
