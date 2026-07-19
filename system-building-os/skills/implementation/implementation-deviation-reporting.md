---
name: implementation-deviation-reporting
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.1.0
---

# Skill: `implementation-deviation-reporting`

**Purpose.** Record deviations per the deviation policy.

**Scope:** implementation  ·  **Runtime:** codex

## Invocation triggers
- on any implementation deviation

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
1. Classify the deviation level 0-3.
2. For level 2 record an ADR and update artifacts/tests.
3. For level 3 preserve the requirement and surface the contradiction.

## Checklist
- [ ] Completed: Classify the deviation level 0-3
- [ ] Completed: For level 2 record an ADR and update artifacts/tests
- [ ] Completed: For level 3 preserve the requirement and surface the contradiction

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
- tests/fixtures/skills/implementation-deviation-reporting.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/implementation-deviation-reporting/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
