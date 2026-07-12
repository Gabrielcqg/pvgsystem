---
name: plan-max-orchestration
description: "Drive the full /plan_max pipeline (Phases 0-28) and produce the Codex package. Triggers: /plan_max invoked; /plan_resume."
---

# plan-max-orchestration

Drive the full /plan_max pipeline (Phases 0-28) and produce the Codex package.

_Scope: planning · runtime adapter: Claude_

## Procedure
1. Run Phase 0 repository/context preflight and set state RECEIVED->UNDERSTANDING.
2. Normalize intent (Phase 1); invoke grill-me-planning three passes (Phases 2-4).
3. Classify gaps with decision-resolution; resolve A-D, group E questions only.
4. Invoke domain planning agents/skills for every system dimension.
5. Assemble the numbered plan package under plans/active/<slug>/.
6. Invoke plan-consistency-validation; only mark IMPLEMENTATION_READY when it passes.

## Checklist
- [ ] Completed: Run Phase 0 repository/context preflight and set state RECEIVED->UNDERSTANDING
- [ ] Completed: Normalize intent (Phase 1)
- [ ] Completed: Classify gaps with decision-resolution
- [ ] Completed: Invoke domain planning agents/skills for every system dimension
- [ ] Completed: Assemble the numbered plan package under plans/active/<slug>/
- [ ] Completed: Invoke plan-consistency-validation

## When NOT to use
- during implementation
- to write product code

## Quality bar
output is specific, testable, and traceable; no vague language

## Do not
- write product code
- expose secrets
- start implementation

> Canonical definition: `system-building-os/skills/planning/plan-max-orchestration.md`
