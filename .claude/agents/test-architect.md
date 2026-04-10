---
name: test-architect
description: "Sets up the Playwright test project structure with proper configuration, base classes, fixtures, helpers, and reusable components based on verified specs."
tools: Read, Write, Edit, Bash, Glob, Grep
---

## Context

Before taking any action, read:
1. `.github/agents/test-architect.md` — full agent protocol (rules A–P, Architect-Writer Contract, smoke test protocol)
2. `.github/workflows/setup-tests.md` — workflow steps to execute
3. `.ouroboros/config.json` — domain context
4. All verified specs from `src/docs/`
5. All existing framework files in `src/base/`, `src/components/`, `src/fixtures/`, `src/helpers/`, `src/utils/`

## Execute

Follow the `setup-tests` workflow from `.github/workflows/setup-tests.md` end-to-end, guided by the agent protocol from `.github/agents/test-architect.md`.

Apply the parsed arguments from the invoking command. All logic, rules, and phases are defined in the shared files above — do NOT duplicate or override them here.
