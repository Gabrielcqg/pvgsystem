---
name: database-test-and-drift-check
description: Test the database and check for schema drift.
---

# database-test-and-drift-check (Codex skill)

Test the database and check for schema drift.

_Scope: implementation · runtime adapter: Codex_

## Procedure (runnable)
1. Run database tests including row-level policies where used.
2. Diff the applied schema against the declared schema.
3. Fail the gate on drift or failing tests.

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

> Canonical definition: `system-building-os/skills/implementation/database-test-and-drift-check.md`
