---
name: frontend-design-fidelity
description: Match the implementation to the design direction and tokens.
---

# frontend-design-fidelity (Codex skill)

Match the implementation to the design direction and tokens.

_Scope: implementation · runtime adapter: Codex_

## Procedure (runnable)
1. Apply design tokens (type, spacing, grid, color).
2. Verify hierarchy, alignment, and motion against the plan.
3. Capture before/after evidence for visual acceptance criteria.

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

> Canonical definition: `system-building-os/skills/implementation/frontend-design-fidelity.md`
