---
name: task-manifest-runner
description: Execute manifest tasks in dependency order with validations.
---

# task-manifest-runner (Codex skill)

Execute manifest tasks in dependency order with validations.

_Scope: implementation · runtime adapter: Codex_

## Procedure (runnable)
1. Select the next unblocked task from the DAG.
2. Load its context packet and enforce file ownership.
3. Run the task's validation commands; on failure escalate to failure-diagnosis.
4. Mark status and update the execution ledger.

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

> Canonical definition: `system-building-os/skills/implementation/task-manifest-runner.md`
