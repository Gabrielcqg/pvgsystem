---
name: acceptance-criteria-validation
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.1.0
---

# Skill: `acceptance-criteria-validation`

**Purpose.** Verify each acceptance criterion with evidence.

**Scope:** implementation  ·  **Runtime:** codex

## Invocation triggers
- VALIDATING_ACCEPTANCE state

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
1. For each AC-### run its setup/action and check the expected result.
2. Attach evidence and mark automated/manual.
3. Reopen the mapped task on failure.

## Checklist
- [ ] Completed: For each AC-### run its setup/action and check the expected result
- [ ] Completed: Attach evidence and mark automated/manual
- [ ] Completed: Reopen the mapped task on failure

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
- tests/fixtures/skills/acceptance-criteria-validation.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/acceptance-criteria-validation/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
