---
name: repository-bootstrap
description: Bootstrap the project skeleton and detect toolchain commands.
---

# repository-bootstrap (Codex skill)

Bootstrap the project skeleton and detect toolchain commands.

_Scope: implementation · runtime adapter: Codex_

## Procedure (runnable)
1. Detect package manager, lint, test, build, and migration commands.
2. Record detected commands in the active plan.
3. Create the minimal runnable skeleton per the architecture.

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

> Canonical definition: `system-building-os/skills/implementation/repository-bootstrap.md`
