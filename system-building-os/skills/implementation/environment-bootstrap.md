---
name: environment-bootstrap
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.1.0
---

# Skill: `environment-bootstrap`

**Purpose.** Bring up local/test/development environments.

**Scope:** implementation  ·  **Runtime:** codex

## Invocation triggers
- environment tasks

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
1. Create env config from .env.example (names only).
2. Start required services and the local database.
3. Verify health checks pass.

## Checklist
- [ ] Completed: Create env config from 
- [ ] Completed: Start required services and the local database
- [ ] Completed: Verify health checks pass

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
- tests/fixtures/skills/environment-bootstrap.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/environment-bootstrap/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
