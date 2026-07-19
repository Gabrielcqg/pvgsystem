---
name: loading-error-empty-states
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.1.0
---

# Skill: `loading-error-empty-states`

**Purpose.** Guarantee loading, error, and empty states exist and are actionable for every data surface.

**Scope:** implementation  ·  **Runtime:** codex

## Invocation triggers
- frontend tasks

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
1. Add loading, empty, and actionable error states to every data-backed surface.
2. Ensure errors explain and offer a next action.
3. Test each state in isolation.

## Checklist
- [ ] Completed: Add loading, empty, and actionable error states to every data-backed surface
- [ ] Completed: Ensure errors explain and offer a next action
- [ ] Completed: Test each state in isolation

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
- tests/fixtures/skills/loading-error-empty-states.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/loading-error-empty-states/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
