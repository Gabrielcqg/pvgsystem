---
name: loading-error-empty-states
description: Guarantee loading, error, and empty states exist and are actionable for every data surface.
---

# loading-error-empty-states (Codex skill)

Guarantee loading, error, and empty states exist and are actionable for every data surface.

_Scope: implementation · runtime adapter: Codex_

## Procedure (runnable)
1. Add loading, empty, and actionable error states to every data-backed surface.
2. Ensure errors explain and offer a next action.
3. Test each state in isolation.

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

> Canonical definition: `system-building-os/skills/implementation/loading-error-empty-states.md`
