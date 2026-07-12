---
name: ai-output-validation
description: Validate AI outputs against schema and evals.
---

# ai-output-validation (Codex skill)

Validate AI outputs against schema and evals.

_Scope: implementation · runtime adapter: Codex_

## Procedure (runnable)
1. Validate every AI output against its output schema.
2. Run golden and red-team evals; enforce thresholds.
3. Trigger fallback/refusal behavior on low confidence.

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

> Canonical definition: `system-building-os/skills/implementation/ai-output-validation.md`
