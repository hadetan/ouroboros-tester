---
description: "Explore a page of the target website, discover sections, and document CRUD operations"
argument-hint: "<page-url> --name \"<page-name>\" [--sections <s1,s2>] [--auth]"
agent: "crawl-explorer"
---

# Explore Page

## Objective
Navigate to the specified page URL, discover all sections, understand CRUD operations, and produce structured specs using the crawl-explorer agent.

## Process

1. Validate arguments — URL and page name are required
2. Read `.ouroboros/config.json` for domain context
3. If `--auth` flag or auth is configured: authenticate first
4. Execute the explore-page workflow with:
   - Target URL
   - Page name
   - Section filter (if --sections provided)
5. Report completion with discovered sections and CRUD operations

## Execution Context
- Workflow: [explore-page](../workflows/explore-page.md)
- Agent: [crawl-explorer](../agents/crawl-explorer.md)
