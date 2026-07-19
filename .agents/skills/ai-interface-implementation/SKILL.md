---
name: ai-interface-implementation
description: Implement the production AI path behind a provider-independent interface with a real adapter.
---

# ai-interface-implementation (Codex skill)

Implement the production AI path behind a provider-independent interface with a real adapter.

_Scope: implementation · runtime adapter: Codex_

## Procedure (runnable)
1. Implement the provider-independent interface and a concrete provider adapter.
2. Wire timeout, retry, rate-limit handling, structured output, and prompt versioning.
3. Add startup validation for missing configuration and reference secrets by env-var name only.
4. Add fakes/mocks for tests and an optional real-key integration test; mock is never the production default.

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

> Canonical definition: `system-building-os/skills/implementation/ai-interface-implementation.md`
