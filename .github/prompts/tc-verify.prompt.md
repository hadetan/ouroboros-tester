---
mode: agent
description: "Verify the accuracy of specs produced by the explorer agent. Re-crawls and fixes inaccuracies."
---

**Arguments:** $input
**Parse:** `<page-slug> [--section <section-slug>] [--auth]`

## Context
Before taking any action, read these files:
1. `.github/agents/spec-verifier.md` — full agent protocol
2. `.github/workflows/verify-specs.md` — workflow steps to execute
3. `.ouroboros/config.json` — domain context
4. `src/docs/{module}/{page}/spec.md` — page spec for `<page-slug>`
5. All section specs under `src/docs/{module}/{page}/sections/`

## Execute
Follow the `verify-specs` workflow from `.github/workflows/verify-specs.md` end-to-end, guided by the agent protocol from `.github/agents/spec-verifier.md`, using the parsed arguments above.
