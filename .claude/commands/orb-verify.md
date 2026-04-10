---
description: "Verify the accuracy of specs produced by the explorer agent. Re-crawls and fixes inaccuracies."
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, mcp__playwright__*
---

**Arguments:** $ARGUMENTS
**Parse:** `<page-slug> [--section <section-slug>] [--auth]`

## Context
Before taking any action, read these files:
1. `.github/agents/spec-verifier.md` — full agent protocol (Goal-Backward Verification, phases 1–5, steps A–G, 28 rejection criteria)
2. `.github/workflows/verify-specs.md` — workflow steps to execute
3. `.ouroboros/config.json` — domain context
4. `src/docs/{module}/{page}/spec.md` — page spec for `<page-slug>`
5. All section specs (`spec.md`) and impl files (`impl.md`) under `src/docs/{module}/{page}/sections/`

## Execute
Follow the `verify-specs` workflow from `.github/workflows/verify-specs.md` end-to-end, guided by the agent protocol from `.github/agents/spec-verifier.md`, using the parsed arguments above.
