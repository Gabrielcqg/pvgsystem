---
name: implementation-deviation-reporting
description: Record deviations per the deviation policy.
---

# implementation-deviation-reporting (Codex skill)

Record deviations per the deviation policy.

_Scope: implementation · runtime adapter: Codex_

## Procedure (runnable)
1. Classify the deviation level 0-3.
2. For level 2 record an ADR and update artifacts/tests.
3. For level 3 preserve the requirement and surface the contradiction.

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

> Canonical definition: `system-building-os/skills/implementation/implementation-deviation-reporting.md`
