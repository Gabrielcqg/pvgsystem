---
name: e2e-browser-validation
description: Run real end-to-end flows in a browser and capture evidence.
---

# e2e-browser-validation (Codex skill)

Run real end-to-end flows in a browser and capture evidence.

_Scope: implementation · runtime adapter: Codex_

## Procedure (runnable)
1. Launch the app and navigate each critical flow.
2. Check console errors, network failures, responsiveness, a11y.
3. Capture screenshots/logs as evidence for acceptance criteria.

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

> Canonical definition: `system-building-os/skills/implementation/e2e-browser-validation.md`
