---
name: integration-test-loop
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.0.0
---

# Skill: `integration-test-loop`

**Purpose.** Write and run integration/contract tests until green.

**Scope:** implementation  ·  **Runtime:** codex

## Invocation triggers
- integration tasks

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
1. Write integration/contract tests across module boundaries.
2. Run them; repair failures.
3. Verify contracts match the API/data schemas.

## Checklist
- [ ] Completed: Write integration/contract tests across module boundaries
- [ ] Completed: Run them
- [ ] Completed: Verify contracts match the API/data schemas

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
- tests/fixtures/skills/integration-test-loop.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/integration-test-loop/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
