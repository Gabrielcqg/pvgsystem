---
name: plan-consistency-validation
description: "Independently validate plan completeness and traceability before handoff. Triggers: Phase 28; /plan_validate."
---

# plan-consistency-validation

Independently validate plan completeness and traceability before handoff.

_Scope: planning · runtime adapter: Claude_

## Procedure
1. Run every check in template 32 and compute a validation score.
2. List critical findings; do not mark ready with open criticals.
3. Assess content quality, not just file existence.

## Checklist
- [ ] Completed: Run every check in template 32 and compute a validation score
- [ ] Completed: List critical findings
- [ ] Completed: Assess content quality, not just file existence

## When NOT to use
- to rubber-stamp a plan because files exist

## Quality bar
output is specific, testable, and traceable; no vague language

## Do not
- write product code
- expose secrets
- start implementation

> Canonical definition: `system-building-os/skills/planning/plan-consistency-validation.md`
