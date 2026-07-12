---
name: database-test-and-drift-check
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.0.0
---

# Skill: `database-test-and-drift-check`

**Purpose.** Test the database and check for schema drift.

**Scope:** implementation  ·  **Runtime:** codex

## Invocation triggers
- after migrations

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
1. Run database tests including row-level policies where used.
2. Diff the applied schema against the declared schema.
3. Fail the gate on drift or failing tests.

## Checklist
- [ ] Completed: Run database tests including row-level policies where used
- [ ] Completed: Diff the applied schema against the declared schema
- [ ] Completed: Fail the gate on drift or failing tests

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
- tests/fixtures/skills/database-test-and-drift-check.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/database-test-and-drift-check/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
