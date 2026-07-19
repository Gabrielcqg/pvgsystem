---
name: frontend-performance
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.1.0
---

# Skill: `frontend-performance`

**Purpose.** Measure and enforce frontend performance budgets (load, bundle, interaction).

**Scope:** implementation  ·  **Runtime:** codex

## Invocation triggers
- frontend REVIEWING state

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
1. Measure initial load, route transitions, bundle size, and input responsiveness.
2. Compare to the plan's budgets and flag regressions.
3. Record results as frontend performance evidence.

## Checklist
- [ ] Completed: Measure initial load, route transitions, bundle size, and input responsiveness
- [ ] Completed: Compare to the plan's budgets and flag regressions
- [ ] Completed: Record results as frontend performance evidence

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
- tests/fixtures/skills/frontend-performance.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/frontend-performance/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
