---
name: design-reference-compliance
description: Verify the implemented UI follows the frontend reference package.
---

# design-reference-compliance (Codex skill)

Verify the implemented UI follows the frontend reference package.

_Scope: implementation · runtime adapter: Codex_

## Procedure (runnable)
1. Compare implementation to MUST_FOLLOW references and non-negotiable visual rules.
2. Flag AVOID patterns that slipped in.
3. Record compliance evidence for the frontend experience review.

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

> Canonical definition: `system-building-os/skills/implementation/design-reference-compliance.md`
