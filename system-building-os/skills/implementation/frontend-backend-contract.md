---
name: frontend-backend-contract
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.1.0
---

# Skill: `frontend-backend-contract`

**Purpose.** Wire each interaction contract to a real backend/server action (no dead buttons, no fake data).

**Scope:** implementation  ·  **Runtime:** codex

## Invocation triggers
- frontend tasks
- integration tasks

## When not to use
- to leave a button without an action
- to use static fake data in production paths

## Expected inputs
- relevant plan artifacts
- task/context as applicable

## Required context
focused context packet or planning artifact set

## Outputs
- artifact(s) and/or validation results with traceable IDs

## Procedure
1. Implement each IX-### interaction: validation, request, handler call, response handling.
2. Remove static/sample data from production paths; call the real API or server action.
3. Add integration tests asserting the request/response contract holds.

## Checklist
- [ ] Completed: Implement each IX-### interaction: validation, request, handler call, response handling
- [ ] Completed: Remove static/sample data from production paths
- [ ] Completed: Add integration tests asserting the request/response contract holds

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
- tests/fixtures/skills/frontend-backend-contract.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/frontend-backend-contract/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
