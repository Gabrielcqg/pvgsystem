---
name: observability-implementation
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.0.0
---

# Skill: `observability-implementation`

**Purpose.** Wire structured logs, metrics, traces, and alerts.

**Scope:** implementation  ·  **Runtime:** codex

## Invocation triggers
- observability tasks

## When not to use
- during product discovery

## Expected inputs
- relevant plan artifacts
- task/context as applicable

## Required context
focused context packet or planning artifact set

## Outputs
- artifact(s) and/or validation results with traceable IDs

## Procedure
1. Emit structured logs with correlation IDs and redaction.
2. Expose metrics and traces per the observability plan.
3. Wire alerts and verify they fire in test.

## Checklist
- [ ] Completed: Emit structured logs with correlation IDs and redaction
- [ ] Completed: Expose metrics and traces per the observability plan
- [ ] Completed: Wire alerts and verify they fire in test

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
- tests/fixtures/skills/observability-implementation.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/observability-implementation/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
