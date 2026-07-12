---
name: frontend-implementation
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.0.0
---

# Skill: `frontend-implementation`

**Purpose.** Implement frontend routes, components, and all screen states.

**Scope:** implementation  ·  **Runtime:** codex

## Invocation triggers
- frontend tasks

## When not to use
- backend or schema files

## Expected inputs
- relevant plan artifacts
- task/context as applicable

## Required context
focused context packet or planning artifact set

## Outputs
- artifact(s) and/or validation results with traceable IDs

## Procedure
1. Implement routes/layouts/components per the frontend plan.
2. Implement default/loading/empty/error/success/disabled states.
3. Wire client validation and server-state; add component tests.

## Checklist
- [ ] Completed: Implement routes/layouts/components per the frontend plan
- [ ] Completed: Implement default/loading/empty/error/success/disabled states
- [ ] Completed: Wire client validation and server-state

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
- tests/fixtures/skills/frontend-implementation.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/frontend-implementation/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
