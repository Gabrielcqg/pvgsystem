---
name: production-like-run-verification
description: Run the clean production-like verification and produce evidence for production_like_run_verified.
---

# production-like-run-verification (Codex skill)

Run the clean production-like verification and produce evidence for production_like_run_verified.

_Scope: implementation · runtime adapter: Codex_

## Procedure (runnable)
1. Install from clean, init + migrate the database, configure non-secret env, build, and start.
2. Verify health, core browser flows, auth, persistence, and AI config behavior.
3. Verify real-provider init when credentials exist and controlled behavior when absent.
4. Inspect logs, browser console, and failed requests; run security + performance checks.
5. Only pass production_like_run_verified with captured evidence.

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

> Canonical definition: `system-building-os/skills/implementation/production-like-run-verification.md`
