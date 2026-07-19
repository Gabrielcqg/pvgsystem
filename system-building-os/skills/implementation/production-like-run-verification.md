---
name: production-like-run-verification
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.1.0
---

# Skill: `production-like-run-verification`

**Purpose.** Run the clean production-like verification and produce evidence for production_like_run_verified.

**Scope:** implementation  ·  **Runtime:** codex

## Invocation triggers
- PRODUCTION_VERIFICATION state

## When not to use
- to pass without a clean run + evidence

## Expected inputs
- relevant plan artifacts
- task/context as applicable

## Required context
focused context packet or planning artifact set

## Outputs
- artifact(s) and/or validation results with traceable IDs

## Procedure
1. Install from clean, init + migrate the database, configure non-secret env, build, and start.
2. Verify health, core browser flows, auth, persistence, and AI config behavior.
3. Verify real-provider init when credentials exist and controlled behavior when absent.
4. Inspect logs, browser console, and failed requests; run security + performance checks.
5. Only pass production_like_run_verified with captured evidence.

## Checklist
- [ ] Completed: Install from clean, init + migrate the database, configure non-secret env, build, and start
- [ ] Completed: Verify health, core browser flows, auth, persistence, and AI config behavior
- [ ] Completed: Verify real-provider init when credentials exist and controlled behavior when absent
- [ ] Completed: Inspect logs, browser console, and failed requests
- [ ] Completed: Only pass production_like_run_verified with captured evidence

## Quality bar
output is specific, testable, and traceable; no vague language

## Failure conditions
- missing required fields
- vague/untestable output
- secret exposure
- scope violation

## Allowed tools
- read
- write
- run_tests
- run_validations

## Disallowed actions
- expose secrets
- reinterpret product scope

## Tool access
implementation (read/write/run)

## Test fixtures
- tests/fixtures/skills/production-like-run-verification.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/production-like-run-verification/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
