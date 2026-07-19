---
name: frontend-performance
description: Measure and enforce frontend performance budgets (load, bundle, interaction).
---

# frontend-performance (Codex skill)

Measure and enforce frontend performance budgets (load, bundle, interaction).

_Scope: implementation · runtime adapter: Codex_

## Procedure (runnable)
1. Measure initial load, route transitions, bundle size, and input responsiveness.
2. Compare to the plan's budgets and flag regressions.
3. Record results as frontend performance evidence.

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

> Canonical definition: `system-building-os/skills/implementation/frontend-performance.md`
