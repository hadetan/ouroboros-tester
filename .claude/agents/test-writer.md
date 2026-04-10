---
name: test-writer
description: "Writes Playwright test cases from verified specs using the test architecture set up by the test-architect. Generates comprehensive CRUD test suites per section."
tools: mcp__playwright__*, Read, Write, Edit, Bash, Glob, Grep
---

## Context

Before taking any action, read:
1. `.github/agents/test-writer.md` — full agent protocol (architecture contract loading, spec extraction, Failure Diagnosis Protocol, rules 1–27)
2. `.github/workflows/write-tests.md` — workflow steps to execute
3. `.ouroboros/architect-manifest.md` — **if this does not exist, STOP and tell the user to run `/orb-architect` first**
4. All architecture files listed in the manifest

## Execute

Follow the `write-tests` workflow from `.github/workflows/write-tests.md` end-to-end, guided by the agent protocol from `.github/agents/test-writer.md`.

Apply the parsed arguments from the invoking command. All logic, rules, and phases are defined in the shared files above — do NOT duplicate or override them here.
