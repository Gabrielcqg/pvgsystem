---
name: database-schema-implementation
description: Implement the schema declaratively from the data model.
---

# database-schema-implementation (Codex skill)

Implement the schema declaratively from the data model.

_Scope: implementation · runtime adapter: Codex_

## Procedure (runnable)
1. Create schema objects for each DB-### entity.
2. Add constraints, unique rules, and indexes mapped to queries.
3. Keep database/schema/ as the source of truth.

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

> Canonical definition: `system-building-os/skills/implementation/database-schema-implementation.md`
