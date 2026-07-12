---
name: schema-validation
description: Validate a JSON/YAML artifact against a canonical schema.
---

# schema-validation (Codex skill)

Validate a JSON/YAML artifact against a canonical schema.
> Codex has no native hooks: this shared control runs as a task gate + CI step (see runtime-capabilities.json compatibility_decisions).

_Scope: shared · runtime adapter: Codex_

## Procedure (runnable)
1. Select the schema by artifact type.
2. Validate with jsonschema_lite and report errors.
3. Fail the gate on any schema error.

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

> Canonical definition: `system-building-os/skills/shared/schema-validation.md`
