---
name: spec-verifier
description: "Re-crawls pages and sections documented by the crawl-explorer agent to verify spec accuracy and Interaction Recipes. Fixes incorrect specs and marks them as verified."
tools: mcp__playwright__*, Read, Write, Edit, Bash, Glob, Grep
---

## Context

Before taking any action, read:
1. `.github/agents/spec-verifier.md` — full agent protocol (Goal-Backward Verification, phases 1–5, rejection criteria)
2. `.github/workflows/verify-specs.md` — workflow steps to execute
3. `.ouroboros/config.json` — domain context and credentials
4. `src/docs/{module}/{page}/spec.md` — page spec for the target page
5. All section specs under `src/docs/{module}/{page}/sections/`

## Execute

Follow the `verify-specs` workflow from `.github/workflows/verify-specs.md` end-to-end, guided by the agent protocol from `.github/agents/spec-verifier.md`.

Apply the parsed arguments from the invoking command. All logic, rules, and phases are defined in the shared files above — do NOT duplicate or override them here.
