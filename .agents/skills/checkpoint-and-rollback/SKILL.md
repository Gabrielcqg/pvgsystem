---
name: checkpoint-and-rollback
description: Create checkpoints and revert only problematic changes.
---

# checkpoint-and-rollback (Codex skill)

Create checkpoints and revert only problematic changes.

_Scope: implementation · runtime adapter: Codex_

## Procedure (runnable)
1. Checkpoint before risky changes.
2. On failure revert only the failed approach, preserving good work.
3. Record the checkpoint and rollback in the ledger.

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

> Canonical definition: `system-building-os/skills/implementation/checkpoint-and-rollback.md`
