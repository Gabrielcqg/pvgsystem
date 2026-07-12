---
name: frontend-implementation
description: Implement frontend routes, components, and all screen states.
---

# frontend-implementation (Codex skill)

Implement frontend routes, components, and all screen states.

_Scope: implementation · runtime adapter: Codex_

## Procedure (runnable)
1. Implement routes/layouts/components per the frontend plan.
2. Implement default/loading/empty/error/success/disabled states.
3. Wire client validation and server-state; add component tests.

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

> Canonical definition: `system-building-os/skills/implementation/frontend-implementation.md`
