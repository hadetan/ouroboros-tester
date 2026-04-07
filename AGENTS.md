# Ouroboros Tester Agents

This project uses 4 specialized agents for automated domain testing, with validation scripts as quality gates between stages.

## Agent: crawl-explorer
- **File:** [.github/agents/crawl-explorer.md](.github/agents/crawl-explorer.md)
- **Role:** Navigate target website using Playwright MCP, discover page sections, prove every interaction with executable evidence (Element Proof Protocol, DOM Diffing, Assertion Dry Runs), capture URL paths and API contracts, and document findings with Interaction Recipes
- **Tools:** All Playwright MCP browser tools + file system
- **Invoked by:** `/tc-explore`, `/tc-run`
- **Writes to:** `src/docs/` (domain specs)
- **Quality gate:** Runs `scripts/validate-spec.mjs` before marking sections as explored

## Agent: spec-verifier
- **File:** [.github/agents/spec-verifier.md](.github/agents/spec-verifier.md)
- **Role:** Re-crawl pages to verify spec accuracy using goal-backward verification, re-execute every Interaction Recipe including Assert fields, run Flow Simulation (CRUD chains), verify API contracts against live endpoints
- **Tools:** All Playwright MCP browser tools + file system + `scripts/api-probe.mjs verify-contract`
- **Invoked by:** `/tc-verify`, `/tc-run`
- **Writes to:** `src/docs/` (verified specs)
- **Quality gate:** Runs `scripts/validate-spec.mjs` after verification

## Agent: test-architect
- **File:** [.github/agents/test-architect.md](.github/agents/test-architect.md)
- **Role:** Set up domain-specific test files (POMs, fixtures, helpers) in `src/`, maps every Interaction Recipe to POM methods, verifies API contracts with `api-probe verify-contract`
- **Tools:** File system + terminal + `scripts/api-probe.mjs`
- **Invoked by:** `/tc-architect`, `/tc-run`
- **Reads from:** `src/docs/` (specs), `src/` (framework)
- **Writes to:** `src/pages/`, `src/fixtures/`, `src/helpers/`
- **Quality gate:** Runs `scripts/validate-architecture.mjs` before handing off to test-writer

## Agent: test-writer
- **File:** [.github/agents/test-writer.md](.github/agents/test-writer.md)
- **Role:** Write Playwright test cases from verified specs using established architecture, with structured Failure Diagnosis Protocol (max 3 retries per test before escalating), uses `api-probe run` for ad-hoc debugging
- **Tools:** Playwright MCP browser tools + file system + `scripts/api-probe.mjs run`
- **Invoked by:** `/tc-write-tests`, `/tc-run`
- **Reads from:** `src/` (framework, pages, fixtures, specs)
- **Writes to:** `src/tests/` (test cases)
