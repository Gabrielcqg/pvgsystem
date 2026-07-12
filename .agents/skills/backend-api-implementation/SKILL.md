---
name: backend-api-implementation
description: Implement API endpoints exactly to contract.
---

# backend-api-implementation (Codex skill)

Implement API endpoints exactly to contract.

_Scope: implementation · runtime adapter: Codex_

## Procedure (runnable)
1. Implement each endpoint per its API-### contract.
2. Enforce request/response schemas, validation, and error codes.
3. Emit events and side effects as specified; add tests.

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

> Canonical definition: `system-building-os/skills/implementation/backend-api-implementation.md`
