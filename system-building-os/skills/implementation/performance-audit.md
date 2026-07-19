---
name: performance-audit
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.1.0
---

# Skill: `performance-audit`

**Purpose.** Measure against performance budgets and detect regressions.

**Scope:** implementation  ·  **Runtime:** codex

## Invocation triggers
- REVIEWING state

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
1. Measure load/latency/bundle/query metrics.
2. Compare to budgets; flag regressions.
3. Record results as the performance gate evidence.

## Checklist
- [ ] Completed: Measure load/latency/bundle/query metrics
- [ ] Completed: Compare to budgets
- [ ] Completed: Record results as the performance gate evidence

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
- tests/fixtures/skills/performance-audit.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/performance-audit/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
