---
description: "Write Playwright test cases from verified specs using the established test architecture."
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, mcp__playwright__*
---

**Arguments:** $ARGUMENTS
**Parse:** `<page-slug> [--section <section>] [--type create|read|update|delete] [--dry-run]`

## Context
Before taking any action, read these files:
1. `.github/agents/test-writer.md` — full agent protocol (architecture contract loading, spec extraction, Failure Diagnosis Protocol, rules 1–27)
2. `.github/workflows/write-tests.md` — workflow steps to execute
3. `.ouroboros/architect-manifest.md` — **if this does not exist, STOP and tell the user to run `/tc-architect` first**
4. All architecture files listed in the manifest

## Execute
Follow the `write-tests` workflow from `.github/workflows/write-tests.md` end-to-end, guided by the agent protocol from `.github/agents/test-writer.md`, using the parsed arguments above.
