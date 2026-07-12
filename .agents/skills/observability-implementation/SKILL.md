---
name: observability-implementation
description: Wire structured logs, metrics, traces, and alerts.
---

# observability-implementation (Codex skill)

Wire structured logs, metrics, traces, and alerts.

_Scope: implementation · runtime adapter: Codex_

## Procedure (runnable)
1. Emit structured logs with correlation IDs and redaction.
2. Expose metrics and traces per the observability plan.
3. Wire alerts and verify they fire in test.

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

> Canonical definition: `system-building-os/skills/implementation/observability-implementation.md`
