---
name: backend-api-implementation
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.0.0
---

# Skill: `backend-api-implementation`

**Purpose.** Implement API endpoints exactly to contract.

**Scope:** implementation  ·  **Runtime:** codex

## Invocation triggers
- backend tasks

## When not to use
- frontend component files

## Expected inputs
- relevant plan artifacts
- task/context as applicable

## Required context
focused context packet or planning artifact set

## Outputs
- artifact(s) and/or validation results with traceable IDs

## Procedure
1. Implement each endpoint per its API-### contract.
2. Enforce request/response schemas, validation, and error codes.
3. Emit events and side effects as specified; add tests.

## Checklist
- [ ] Completed: Implement each endpoint per its API-### contract
- [ ] Completed: Enforce request/response schemas, validation, and error codes
- [ ] Completed: Emit events and side effects as specified

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
- tests/fixtures/skills/backend-api-implementation.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/backend-api-implementation/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
