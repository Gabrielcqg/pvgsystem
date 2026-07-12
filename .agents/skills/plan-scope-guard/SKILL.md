---
name: plan-scope-guard
description: Prevent scope creep and unauthorized product-behavior changes.
---

# plan-scope-guard (Codex skill)

Prevent scope creep and unauthorized product-behavior changes.

_Scope: implementation · runtime adapter: Codex_

## Procedure (runnable)
1. Compare proposed changes to the active requirements.
2. Block Level-3 (product behavior) changes; require a new plan version.
3. Allow Level 0-2 deviations with logging/ADR per the deviation policy.

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

> Canonical definition: `system-building-os/skills/implementation/plan-scope-guard.md`
