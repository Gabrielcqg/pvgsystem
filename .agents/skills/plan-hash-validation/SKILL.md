---
name: plan-hash-validation
description: Verify the active plan version and content hash match EXECUTION.lock.
---

# plan-hash-validation (Codex skill)

Verify the active plan version and content hash match EXECUTION.lock.
> Codex has no native hooks: this shared control runs as a task gate + CI step (see runtime-capabilities.json compatibility_decisions).

_Scope: shared · runtime adapter: Codex_

## Procedure (runnable)
1. Compute the plan package hash.
2. Compare against PLAN_METADATA and EXECUTION.lock.
3. Block implementation on mismatch or conflicting versions.

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

> Canonical definition: `system-building-os/skills/shared/plan-hash-validation.md`
