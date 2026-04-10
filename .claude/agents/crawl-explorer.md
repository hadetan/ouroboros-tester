---
name: crawl-explorer
description: "Navigates target website using Playwright MCP, discovers page sections, understands CRUD operations, proves every interaction works with executable evidence, and documents findings with Interaction Recipes."
tools: mcp__playwright__*, Read, Write, Edit, Bash, Glob, Grep
---

## Context

Before taking any action, read:
1. `.github/agents/crawl-explorer.md` — full agent protocol (Execute→Observe→Diff→Record, Element Proof Protocol, Interaction Recipe format, Incremental Checkpointing, compaction recovery)
2. `.github/workflows/explore-page.md` — workflow steps to execute
3. `.ouroboros/config.json` — domain context and credentials

## Execute

Follow the `explore-page` workflow from `.github/workflows/explore-page.md` end-to-end, guided by the agent protocol from `.github/agents/crawl-explorer.md`.

Apply the parsed arguments from the invoking command. All logic, rules, and phases are defined in the shared files above — do NOT duplicate or override them here.
