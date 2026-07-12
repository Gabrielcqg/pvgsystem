---
name: unit-test-loop
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.0.0
---

# Skill: `unit-test-loop`

**Purpose.** Write and run unit tests until green.

**Scope:** implementation  ·  **Runtime:** codex

## Invocation triggers
- every code task

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
1. Write unit tests for the task's units.
2. Run them; on failure escalate to failure-diagnosis.
3. Do not mark done until unit tests pass.

## Checklist
- [ ] Completed: Write unit tests for the task's units
- [ ] Completed: Run them
- [ ] Completed: Do not mark done until unit tests pass

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
- tests/fixtures/skills/unit-test-loop.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/unit-test-loop/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
