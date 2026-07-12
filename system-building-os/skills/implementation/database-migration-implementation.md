---
name: database-migration-implementation
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.0.0
---

# Skill: `database-migration-implementation`

**Purpose.** Implement ordered, reversible migrations.

**Scope:** implementation  ·  **Runtime:** codex

## Invocation triggers
- database tasks

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
1. Write forward + rollback migrations for each change.
2. Apply to the local/test database and verify.
3. Use expand-and-contract for destructive changes.

## Checklist
- [ ] Completed: Write forward + rollback migrations for each change
- [ ] Completed: Apply to the local/test database and verify
- [ ] Completed: Use expand-and-contract for destructive changes

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
- tests/fixtures/skills/database-migration-implementation.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/database-migration-implementation/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
