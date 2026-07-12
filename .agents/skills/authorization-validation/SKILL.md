---
name: authorization-validation
description: Implement and test authorization boundaries and isolation.
---

# authorization-validation (Codex skill)

Implement and test authorization boundaries and isolation.

_Scope: implementation · runtime adapter: Codex_

## Procedure (runnable)
1. Enforce roles/permissions on every protected action.
2. Enforce organization/tenant isolation.
3. Add authorization tests including negative cases.

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

> Canonical definition: `system-building-os/skills/implementation/authorization-validation.md`
