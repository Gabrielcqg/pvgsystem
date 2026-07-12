---
name: migration-planning
description: "Plan migration ordering, rollback, and drift checks. Triggers: Phase 10."
---

# migration-planning

Plan migration ordering, rollback, and drift checks.

_Scope: planning · runtime adapter: Claude_

## Procedure
1. Choose a migration tool/approach.
2. Define backward-compatible + expand-and-contract strategy for destructive changes.
3. Define per-migration rollback and a schema-drift check.

## Checklist
- [ ] Completed: Choose a migration tool/approach
- [ ] Completed: Define backward-compatible + expand-and-contract strategy for destructive changes
- [ ] Completed: Define per-migration rollback and a schema-drift check

## When NOT to use
- during implementation

## Quality bar
output is specific, testable, and traceable; no vague language

## Do not
- write product code
- expose secrets
- start implementation

> Canonical definition: `system-building-os/skills/planning/migration-planning.md`
