---
name: frontend-experience-review
description: "Independent frontend quality gate: is the UI product-expressive, complete, and reference-compliant?"
---

# frontend-experience-review (Codex skill)

Independent frontend quality gate: is the UI product-expressive, complete, and reference-compliant?

_Scope: implementation · runtime adapter: Codex_

## Procedure (runnable)
1. Run the visual-quality-review checks across all dimensions.
2. Reject generic UIs, hidden product logic, dead space, and stretched-to-fill layouts.
3. Only pass frontend_experience_review_passed when the experience is complete and expressive.
4. Emit a visual-quality-review artifact with evidence.

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

> Canonical definition: `system-building-os/skills/implementation/frontend-experience-review.md`
