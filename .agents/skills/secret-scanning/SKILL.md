---
name: secret-scanning
description: Scan for secret exposure in files, diffs, and command output.
---

# secret-scanning (Codex skill)

Scan for secret exposure in files, diffs, and command output.
> Codex has no native hooks: this shared control runs as a task gate + CI step (see runtime-capabilities.json compatibility_decisions).

_Scope: shared · runtime adapter: Codex_

## Procedure (runnable)
1. Match protected-path patterns and known secret signatures.
2. Block reads/writes/commits that would expose secrets.
3. Report only metadata (never the secret value).

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

> Canonical definition: `system-building-os/skills/shared/secret-scanning.md`
