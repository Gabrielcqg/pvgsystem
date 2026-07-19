---
name: frontend-state-completeness
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.1.0
---

# Skill: `frontend-state-completeness`

**Purpose.** Implement every declared UI state, including AI states, with no impossible states.

**Scope:** implementation  ·  **Runtime:** codex

## Invocation triggers
- frontend tasks
- AI UI tasks

## When not to use
- to omit loading/error/empty states

## Expected inputs
- relevant plan artifacts
- task/context as applicable

## Required context
focused context packet or planning artifact set

## Outputs
- artifact(s) and/or validation results with traceable IDs

## Procedure
1. Implement default/loading/streaming/generating/reconnecting/empty/partial/error/success/disabled/permission_denied states per contract.
2. Wire AI states: constructing context, generating, validating, streaming, saving, retrying, provider unavailable.
3. Add tests asserting each state renders from its trigger.

## Checklist
- [ ] Completed: Implement default/loading/streaming/generating/reconnecting/empty/partial/error/success/disabled/permission_denied states per contract
- [ ] Completed: Wire AI states: constructing context, generating, validating, streaming, saving, retrying, provider unavailable
- [ ] Completed: Add tests asserting each state renders from its trigger

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
- tests/fixtures/skills/frontend-state-completeness.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/frontend-state-completeness/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
