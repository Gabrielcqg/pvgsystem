---
name: grill-me-planning
description: "Adversarial interrogation of the product and plan; produce concrete findings, not ceremony. Triggers: every planning request; /grill_max."
---

# grill-me-planning

Adversarial interrogation of the product and plan; produce concrete findings, not ceremony.

_Scope: planning · runtime adapter: Claude_

## Procedure
1. Pass 1 (product reality): is the stated problem the real problem? who has it? why now?
2. Pass 2 (system completeness): sweep every dimension (users..rollback) for gaps.
3. Pass 3 (implementation ambiguity): could Codex implement without guessing?
4. Record findings with severity and the requirement/area they affect.
5. Emit high-value questions only for material product ambiguity (Category E).

## Checklist
- [ ] Completed: Pass 1 (product reality): is the stated problem the real problem? who has it? why now?
- [ ] Completed: Pass 2 (system completeness): sweep every dimension (users
- [ ] Completed: Pass 3 (implementation ambiguity): could Codex implement without guessing?
- [ ] Completed: Record findings with severity and the requirement/area they affect
- [ ] Completed: Emit high-value questions only for material product ambiguity (Category E)

## When NOT to use
- never skip; it is mandatory for every plan

## Quality bar
output is specific, testable, and traceable; no vague language

## Do not
- write product code
- expose secrets
- start implementation

> Canonical definition: `system-building-os/skills/planning/grill-me-planning.md`
