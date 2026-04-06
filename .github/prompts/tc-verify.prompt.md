---
description: "Verify the accuracy of specs produced by the explorer agent"
argument-hint: "<page-slug> [--section <section-slug>] [--auth]"
agent: "spec-verifier"
---

# Verify Specs

## Objective
Re-crawl a documented page and verify every claim in the specs is accurate. Fix inaccuracies and mark specs as verified.

## Process

1. Validate arguments — page-slug is required
2. Read `.ouroboros/config.json` and page spec
3. If `--auth` flag: authenticate first
4. Execute the verify-specs workflow
5. Report verification results with accuracy score

## Execution Context
- Workflow: [verify-specs](../workflows/verify-specs.md)
- Agent: [spec-verifier](../agents/spec-verifier.md)
