---
mode: agent
description: "Explore a page of the target website, discover sections, and document CRUD operations"
---

**Arguments:** $input
**Parse:** `<page-url> --name "<page-name>" [--sections <s1,s2>] [--auth]`

## Context
Before taking any action, read these files:
1. `.github/agents/crawl-explorer.md` — full agent protocol
2. `.github/workflows/explore-page.md` — workflow steps to execute

## Execute
Follow the `explore-page` workflow from `.github/workflows/explore-page.md` end-to-end, guided by the agent protocol from `.github/agents/crawl-explorer.md`, using the parsed arguments above.
