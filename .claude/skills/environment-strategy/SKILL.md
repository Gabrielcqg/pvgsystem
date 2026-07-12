---
name: environment-strategy
description: "Define local, test, development, staging, and production environments. Triggers: Phase 16."
---

# environment-strategy

Define local, test, development, staging, and production environments.

_Scope: planning · runtime adapter: Claude_

## Procedure
1. For each environment define services, database, variables (names only).
2. Define network boundaries, access model, deployment, and migrations.
3. Define monitoring, test data, teardown, and rollback.

## Checklist
- [ ] Completed: For each environment define services, database, variables (names only)
- [ ] Completed: Define network boundaries, access model, deployment, and migrations
- [ ] Completed: Define monitoring, test data, teardown, and rollback

## When NOT to use
- to place secret values anywhere

## Quality bar
output is specific, testable, and traceable; no vague language

## Do not
- write product code
- expose secrets
- start implementation

> Canonical definition: `system-building-os/skills/planning/environment-strategy.md`
