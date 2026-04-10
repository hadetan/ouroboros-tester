---
mode: agent
description: "Execute the full pipeline: explore, verify, architect, and write-tests for a page."
---

**Arguments:** $input
**Parse:** `<page-url> --name "<page-name>" [--auth]`

## Context
Before taking any action, read these agent and workflow files:
- `.github/agents/crawl-explorer.md` — explore agent protocol
- `.github/agents/spec-verifier.md` — verify agent protocol
- `.github/agents/test-architect.md` — architect agent protocol (if architecture not yet set up)
- `.github/agents/test-writer.md` — test-writer agent protocol
- `.github/workflows/explore-page.md` — explore workflow
- `.github/workflows/verify-specs.md` — verify workflow
- `.github/workflows/setup-tests.md` — architect workflow (if `.ouroboros/architect-manifest.md` doesn't exist)
- `.github/workflows/write-tests.md` — write-tests workflow

## Execute
Run the full pipeline sequentially. Complete each stage before moving to the next:

1. **Explore** — Follow `explore-page` workflow with the parsed URL and page name
2. **Verify** — Follow `verify-specs` workflow for the explored page slug
3. **Architect** (if `.ouroboros/architect-manifest.md` does not exist) — Follow `setup-tests` workflow
4. **Write tests** — Follow `write-tests` workflow for the page slug

Report final status after all stages complete.
