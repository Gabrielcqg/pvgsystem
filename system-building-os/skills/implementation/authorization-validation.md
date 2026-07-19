---
name: authorization-validation
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.1.0
---

# Skill: `authorization-validation`

**Purpose.** Implement and test authorization boundaries and isolation.

**Scope:** implementation  ·  **Runtime:** codex

## Invocation triggers
- auth tasks

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
1. Enforce roles/permissions on every protected action.
2. Enforce organization/tenant isolation.
3. Add authorization tests including negative cases.

## Checklist
- [ ] Completed: Enforce roles/permissions on every protected action
- [ ] Completed: Enforce organization/tenant isolation
- [ ] Completed: Add authorization tests including negative cases

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
- tests/fixtures/skills/authorization-validation.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/authorization-validation/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
