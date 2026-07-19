---
name: frontend-product-translation
description: Translate product requirements and the intelligence matrix into concrete frontend behavior.
---

# frontend-product-translation (Codex skill)

Translate product requirements and the intelligence matrix into concrete frontend behavior.

_Scope: implementation · runtime adapter: Codex_

## Procedure (runnable)
1. Map each user-facing requirement to the surfaces and states that express it.
2. Ensure the product's central logic is visible in the UI, not hidden.
3. Reject generic renderings of product-specific logic.

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

> Canonical definition: `system-building-os/skills/implementation/frontend-product-translation.md`
