---
description: "Set up Playwright test project infrastructure from verified specs"
argument-hint: "[--force]"
agent: "test-architect"
---

# Setup Test Architecture

## Objective
Analyze all verified specs and create a production-ready Playwright test project with proper architecture, POM pattern, fixtures, and reusable components.

## Process

1. Read all verified specs from `src/docs/`
2. Analyze common patterns across pages
3. Execute the setup-tests workflow
4. Report created files and detected patterns

## Execution Context
- Workflow: [setup-tests](../workflows/setup-tests.md)
- Agent: [test-architect](../agents/test-architect.md)
