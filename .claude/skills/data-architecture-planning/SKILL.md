---
name: data-architecture-planning
description: "Design the data model and produce a machine-readable representation. Triggers: Phase 10."
---

# data-architecture-planning

Design the data model and produce a machine-readable representation.

_Scope: planning · runtime adapter: Claude_

## Procedure
1. Decide persistence need and database kind(s).
2. Define entities (DB-###), fields, types, relationships, constraints, indexes.
3. Mark ownership, classification, personal data, retention.
4. Emit data-model.yaml validating against data-model.schema.json.

## Checklist
- [ ] Completed: Decide persistence need and database kind(s)
- [ ] Completed: Define entities (DB-###), fields, types, relationships, constraints, indexes
- [ ] Completed: Mark ownership, classification, personal data, retention
- [ ] Completed: Emit data-model

## When NOT to use
- during implementation

## Quality bar
output is specific, testable, and traceable; no vague language

## Do not
- write product code
- expose secrets
- start implementation

> Canonical definition: `system-building-os/skills/planning/data-architecture-planning.md`
