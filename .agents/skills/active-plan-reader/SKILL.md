---
name: active-plan-reader
description: Locate, load, and validate the active plan package and its version/hash.
---

# active-plan-reader (Codex skill)

Locate, load, and validate the active plan package and its version/hash.

_Scope: implementation · runtime adapter: Codex_

## Procedure (runnable)
1. Find plans/active/<slug>/ and read PLAN_METADATA.yaml.
2. Verify the plan hash and EXECUTION.lock status.
3. Load task manifest, agent map, skill map, and acceptance criteria.
4. Fail fast if the package is incomplete or conflicting.

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

> Canonical definition: `system-building-os/skills/implementation/active-plan-reader.md`
