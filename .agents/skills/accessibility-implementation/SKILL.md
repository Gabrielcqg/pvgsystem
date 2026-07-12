---
name: accessibility-implementation
description: Implement accessibility to the target conformance level.
---

# accessibility-implementation (Codex skill)

Implement accessibility to the target conformance level.

_Scope: implementation · runtime adapter: Codex_

## Procedure (runnable)
1. Add semantic roles, labels, and focus management.
2. Verify contrast and keyboard operability.
3. Run an automated a11y check and record results.

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

> Canonical definition: `system-building-os/skills/implementation/accessibility-implementation.md`
