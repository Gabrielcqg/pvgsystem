---
name: file-ownership-planning
description: "Assign file ownership and parallelization groups to prevent write conflicts. Triggers: Phase 25."
---

# file-ownership-planning

Assign file ownership and parallelization groups to prevent write conflicts.

_Scope: planning · runtime adapter: Claude_

## Procedure
1. Assign each owned path a mode and owner.
2. Serialize shared schema/config/manifests/routing/types/migrations.
3. Parallelize independent modules and read-only reviews.
4. Validate against file-ownership.schema.json.

## Checklist
- [ ] Completed: Assign each owned path a mode and owner
- [ ] Completed: Serialize shared schema/config/manifests/routing/types/migrations
- [ ] Completed: Parallelize independent modules and read-only reviews
- [ ] Completed: Validate against file-ownership

## When NOT to use
- during implementation

## Quality bar
output is specific, testable, and traceable; no vague language

## Do not
- write product code
- expose secrets
- start implementation

> Canonical definition: `system-building-os/skills/planning/file-ownership-planning.md`
