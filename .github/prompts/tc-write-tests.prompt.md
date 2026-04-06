---
description: "Write Playwright test cases from verified specs"
argument-hint: "<page-slug> [--section <section>] [--type create|read|update|delete] [--dry-run]"
agent: "test-writer"
---

# Write Tests

## Objective
Generate comprehensive Playwright test suites from verified specs using the established test architecture.

## Process

1. Validate arguments — page-slug is required
2. Verify specs are verified for the target page
3. Verify test architecture exists
4. Execute the write-tests workflow
5. Run generated tests to validate
6. Report test count, pass/fail status, coverage

## Execution Context
- Workflow: [write-tests](../workflows/write-tests.md)
- Agent: [test-writer](../agents/test-writer.md)
