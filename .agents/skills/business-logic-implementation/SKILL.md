---
name: business-logic-implementation
description: Implement business rules deterministically.
---

# business-logic-implementation (Codex skill)

Implement business rules deterministically.

_Scope: implementation · runtime adapter: Codex_

## Procedure (runnable)
1. Implement each RULE-### with its exact condition and precedence.
2. Handle exceptions and failure behavior.
3. Add unit tests including the rule's worked examples.

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

> Canonical definition: `system-building-os/skills/implementation/business-logic-implementation.md`
