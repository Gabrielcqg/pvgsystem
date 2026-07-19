---
name: visual-regression
description: Capture and compare visual evidence for major screens; flag regressions.
---

# visual-regression (Codex skill)

Capture and compare visual evidence for major screens; flag regressions.

_Scope: implementation · runtime adapter: Codex_

## Procedure (runnable)
1. Capture screenshots for major screens across breakpoints.
2. Compare against baselines or perform structured visual review when baselines are absent.
3. Attach evidence to visual acceptance criteria.

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

> Canonical definition: `system-building-os/skills/implementation/visual-regression.md`
