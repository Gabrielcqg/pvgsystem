---
name: creative-ui-concept
description: Realize the product's differentiating visual/interaction concept, not a generic dashboard.
---

# creative-ui-concept (Codex skill)

Realize the product's differentiating visual/interaction concept, not a generic dashboard.

_Scope: implementation · runtime adapter: Codex_

## Procedure (runnable)
1. Implement the custom visualization/interaction identified in the frontend grill.
2. Use timelines/process maps/comparisons/scores/simulations where the plan calls for them.
3. Avoid dead space and cards stretched only to fill containers.

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

> Canonical definition: `system-building-os/skills/implementation/creative-ui-concept.md`
