---
description: "Explore a page of the target website, discover sections, prove CRUD interactions, and write specs."
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, mcp__playwright__*
---

**Arguments:** $ARGUMENTS
**Parse:** `<page-url> --name "<page-name>" [--sections <s1,s2>] [--auth]`

## Context
Before taking any action, read these files:
1. `.github/agents/crawl-explorer.md` — full agent protocol (Execute→Observe→Diff→Record, phases 1–8, Element Proof Protocol, Interaction Recipe format, checkpointing)
2. `.github/workflows/explore-page.md` — workflow steps to execute

## Execute
Follow the `explore-page` workflow from `.github/workflows/explore-page.md` end-to-end, guided by the agent protocol from `.github/agents/crawl-explorer.md`, using the parsed arguments above.
