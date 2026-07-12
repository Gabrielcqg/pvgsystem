---
name: integration-planning
description: "Specify external integrations with fallback and mock strategy. Triggers: Phase 13."
---

# integration-planning

Specify external integrations with fallback and mock strategy.

_Scope: planning · runtime adapter: Claude_

## Procedure
1. Assign INT-### and define auth, data in/out, triggers, timeouts, retries.
2. Define failure behavior, fallback, sandbox, and mock strategy.
3. Define contract tests.

## Checklist
- [ ] Completed: Assign INT-### and define auth, data in/out, triggers, timeouts, retries
- [ ] Completed: Define failure behavior, fallback, sandbox, and mock strategy
- [ ] Completed: Define contract tests

## When NOT to use
- during implementation

## Quality bar
output is specific, testable, and traceable; no vague language

## Do not
- write product code
- expose secrets
- start implementation

> Canonical definition: `system-building-os/skills/planning/integration-planning.md`
