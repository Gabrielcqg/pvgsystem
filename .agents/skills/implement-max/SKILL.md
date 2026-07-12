---
name: implement-max
description: "Entry skill: implement the active plan until all completion gates pass."
---

# implement-max (Codex skill)

Entry skill: implement the active plan until all completion gates pass.

_Scope: implementation · runtime adapter: Codex_

## Procedure (runnable)
1. Locate and validate the active plan; read PLAN_METADATA and EXECUTION.lock.
2. Load the task manifest and execute tasks in dependency order.
3. Run validations after each task and phase; repair failures autonomously.
4. Preserve product scope; record deviations; continue until gates pass.
5. Invoke the final-acceptance-judge before declaring completion.

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

> Canonical definition: `system-building-os/skills/implementation/implement-max.md`
