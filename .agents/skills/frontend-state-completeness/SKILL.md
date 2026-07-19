---
name: frontend-state-completeness
description: Implement every declared UI state, including AI states, with no impossible states.
---

# frontend-state-completeness (Codex skill)

Implement every declared UI state, including AI states, with no impossible states.

_Scope: implementation · runtime adapter: Codex_

## Procedure (runnable)
1. Implement default/loading/streaming/generating/reconnecting/empty/partial/error/success/disabled/permission_denied states per contract.
2. Wire AI states: constructing context, generating, validating, streaming, saving, retrying, provider unavailable.
3. Add tests asserting each state renders from its trigger.

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

> Canonical definition: `system-building-os/skills/implementation/frontend-state-completeness.md`
