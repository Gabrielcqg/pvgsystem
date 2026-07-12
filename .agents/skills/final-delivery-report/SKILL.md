---
name: final-delivery-report
description: Produce the truthful, evidence-based final report.
---

# final-delivery-report (Codex skill)

Produce the truthful, evidence-based final report.

_Scope: implementation · runtime adapter: Codex_

## Procedure (runnable)
1. Report every completion gate PASS/FAIL/NA with evidence.
2. List deviations, external blockers, and honest failures.
3. Validate against final-report.schema.json.

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

> Canonical definition: `system-building-os/skills/implementation/final-delivery-report.md`
