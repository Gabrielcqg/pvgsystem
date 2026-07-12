---
name: phase-completion-reporting
description: Report phase completion and update state.
---

# phase-completion-reporting (Codex skill)

Report phase completion and update state.

_Scope: implementation · runtime adapter: Codex_

## Procedure (runnable)
1. Summarize what completed and validation status.
2. Write a phase log and update runtime state.
3. Confirm gates relevant to the phase are green.

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

> Canonical definition: `system-building-os/skills/implementation/phase-completion-reporting.md`
