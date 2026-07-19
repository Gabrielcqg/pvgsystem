---
name: database-schema-implementation
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.1.0
---

# Skill: `database-schema-implementation`

**Purpose.** Implement the schema declaratively from the data model.

**Scope:** implementation  ·  **Runtime:** codex

## Invocation triggers
- database tasks

## When not to use
- application source outside database/

## Expected inputs
- relevant plan artifacts
- task/context as applicable

## Required context
focused context packet or planning artifact set

## Outputs
- artifact(s) and/or validation results with traceable IDs

## Procedure
1. Create schema objects for each DB-### entity.
2. Add constraints, unique rules, and indexes mapped to queries.
3. Keep database/schema/ as the source of truth.

## Checklist
- [ ] Completed: Create schema objects for each DB-### entity
- [ ] Completed: Add constraints, unique rules, and indexes mapped to queries
- [ ] Completed: Keep database/schema/ as the source of truth

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
- tests/fixtures/skills/database-schema-implementation.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/database-schema-implementation/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
