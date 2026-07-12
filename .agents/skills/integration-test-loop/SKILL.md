---
name: integration-test-loop
description: Write and run integration/contract tests until green.
---

# integration-test-loop (Codex skill)

Write and run integration/contract tests until green.

_Scope: implementation · runtime adapter: Codex_

## Procedure (runnable)
1. Write integration/contract tests across module boundaries.
2. Run them; repair failures.
3. Verify contracts match the API/data schemas.

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

> Canonical definition: `system-building-os/skills/implementation/integration-test-loop.md`
