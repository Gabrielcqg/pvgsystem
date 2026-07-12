---
name: context-packet-loader
description: Load only the focused context a task needs.
---

# context-packet-loader (Codex skill)

Load only the focused context a task needs.

_Scope: implementation · runtime adapter: Codex_

## Procedure (runnable)
1. Read the task's context packet.
2. Load referenced requirements, files, tests, and skills only.
3. Reject work that requires context outside the packet without escalation.

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

> Canonical definition: `system-building-os/skills/implementation/context-packet-loader.md`
