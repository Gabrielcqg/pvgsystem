---
name: frontend-backend-contract-planning
description: "Bind every frontend interaction to its backend/local behavior end to end. Triggers: Phase 12-13 reconciliation."
---

# frontend-backend-contract-planning

Bind every frontend interaction to its backend/local behavior end to end.

_Scope: planning · runtime adapter: Claude_

## Procedure
1. For each user action emit an IX-### interaction contract.
2. Define request contract, backend handler, business rule, AI behavior, database effect.
3. Define success + error responses, loading/streaming/retry/optimistic behavior, feedback.
4. Reject buttons with no contract and user-visible backend features with no surface.
5. Validate against interaction-contract.schema.json.

## Checklist
- [ ] Completed: For each user action emit an IX-### interaction contract
- [ ] Completed: Define request contract, backend handler, business rule, AI behavior, database effect
- [ ] Completed: Define success + error responses, loading/streaming/retry/optimistic behavior, feedback
- [ ] Completed: Reject buttons with no contract and user-visible backend features with no surface
- [ ] Completed: Validate against interaction-contract

## When NOT to use
- to leave a button without an implementation contract

## Quality bar
output is specific, testable, and traceable; no vague language

## Do not
- write product code
- expose secrets
- start implementation

> Canonical definition: `system-building-os/skills/planning/frontend-backend-contract-planning.md`
