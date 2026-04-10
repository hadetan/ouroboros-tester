---
mode: agent
description: "Set up Playwright test project infrastructure from verified specs. Creates POMs, fixtures, helpers."
---

**Arguments:** $input
**Parse:** `[--force]`

## Context
Before taking any action, read these files:
1. `.github/agents/test-architect.md` — full agent protocol
2. `.github/workflows/setup-tests.md` — workflow steps to execute
3. `.ouroboros/config.json` — domain context
4. All verified specs from `src/docs/`
5. All existing framework files in `src/base/`, `src/components/`, `src/fixtures/`, `src/helpers/`, `src/utils/`

## Execute
Follow the `setup-tests` workflow from `.github/workflows/setup-tests.md` end-to-end, guided by the agent protocol from `.github/agents/test-architect.md`, using the parsed arguments above.
