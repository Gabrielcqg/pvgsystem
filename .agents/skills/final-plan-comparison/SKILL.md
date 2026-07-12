---
name: final-plan-comparison
description: Compare the implementation to the plan before delivery.
---

# final-plan-comparison (Codex skill)

Compare the implementation to the plan before delivery.

_Scope: implementation · runtime adapter: Codex_

## Procedure (runnable)
1. Walk requirement->task->files and acceptance->test->evidence.
2. List any missing or failing items and reopen them.
3. Only pass when every required item is satisfied with evidence.

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

> Canonical definition: `system-building-os/skills/implementation/final-plan-comparison.md`
