---
description: "Initialize Ouroboros Tester for a new domain. Sets up config, templates, and state tracking."
argument-hint: "<base-url> [--name <project-name>]"
agent: "agent"
---

**Arguments:** $input
**Parse:** `<base-url> [--name <project-name>]`

## Context
Before taking any action, read:
- `.github/workflows/init.md` — workflow steps to execute
- `templates/config.template.json` — config template reference

## Execute
Follow the `init` workflow from `.github/workflows/init.md` end-to-end using the parsed arguments above.
