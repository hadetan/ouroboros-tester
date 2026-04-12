---
description: "Write Playwright test cases from verified specs using the established test architecture."
argument-hint: "<page-slug> [--section <section>] [--type create|read|update|delete] [--dry-run]"
agent: "test-writer"
---

**Arguments:** $input
**Parse:** `<page-slug> [--section <section>] [--type create|read|update|delete] [--dry-run]`

## Context
Before taking any action, read these files:
1. `.github/agents/test-writer.md` — full agent protocol
2. `.github/workflows/write-tests.md` — workflow steps to execute
3. `.ouroboros/architect-manifest.md` — if this does not exist, discover architecture from `src/` directly
4. All architecture files listed in the manifest (or discovered from `src/` if no manifest)

## Execute
Follow the `write-tests` workflow from `.github/workflows/write-tests.md` end-to-end, guided by the agent protocol from `.github/agents/test-writer.md`, using the parsed arguments above.
