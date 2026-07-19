---
name: frontend-backend-contract
description: Wire each interaction contract to a real backend/server action (no dead buttons, no fake data).
---

# frontend-backend-contract (Codex skill)

Wire each interaction contract to a real backend/server action (no dead buttons, no fake data).

_Scope: implementation · runtime adapter: Codex_

## Procedure (runnable)
1. Implement each IX-### interaction: validation, request, handler call, response handling.
2. Remove static/sample data from production paths; call the real API or server action.
3. Add integration tests asserting the request/response contract holds.

## Inputs it may rely on
- relevant plan artifacts
- task/context as applicable

## Files it may own
Determined by the assigned task's `files_to_create`/`files_to_modify`.
## Files it must not touch
Anything outside the task's ownership or in protected paths.

## Validations it must run
- read
- write
- run_tests
- run_validations

## Success
output is specific, testable, and traceable; no vague language

## Failure / escalate to recovery
- missing required fields
- vague/untestable output
- secret exposure
- scope violation

## Return control to supervisor when
the procedure completes or the failure budget is exhausted.

> Canonical definition: `system-building-os/skills/implementation/frontend-backend-contract.md`
