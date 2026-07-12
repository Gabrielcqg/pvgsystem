---
name: acceptance-criteria-validation
description: Verify each acceptance criterion with evidence.
---

# acceptance-criteria-validation (Codex skill)

Verify each acceptance criterion with evidence.

_Scope: implementation · runtime adapter: Codex_

## Procedure (runnable)
1. For each AC-### run its setup/action and check the expected result.
2. Attach evidence and mark automated/manual.
3. Reopen the mapped task on failure.

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

> Canonical definition: `system-building-os/skills/implementation/acceptance-criteria-validation.md`
