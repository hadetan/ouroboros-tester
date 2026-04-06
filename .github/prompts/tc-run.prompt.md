---
description: "Execute the full pipeline: explore, verify, architect, and write-tests for a page"
argument-hint: "<page-url> --name \"<page-name>\" [--auth]"
agent: "crawl-explorer"
---

# Full Pipeline Run

## Objective
Run the complete Ouroboros Tester pipeline for a single page: explore, verify, set up architecture (if needed), and write tests.

## Process

1. Run `/tc-explore <page-url> --name "<page-name>" [--auth]`
2. Wait for exploration to complete
3. Run `/tc-verify <page-slug> [--auth]`
4. If test architecture doesn't exist: Run `/tc-architect`
5. Run `/tc-write-tests <page-slug>`
6. Report final status

## Execution Context
- Workflows: [explore-page](../workflows/explore-page.md), [verify-specs](../workflows/verify-specs.md), [setup-tests](../workflows/setup-tests.md), [write-tests](../workflows/write-tests.md)
