---
name: business-logic-implementation
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.0.0
---

# Skill: `business-logic-implementation`

**Purpose.** Implement business rules deterministically.

**Scope:** implementation  ·  **Runtime:** codex

## Invocation triggers
- backend tasks

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
1. Implement each RULE-### with its exact condition and precedence.
2. Handle exceptions and failure behavior.
3. Add unit tests including the rule's worked examples.

## Checklist
- [ ] Completed: Implement each RULE-### with its exact condition and precedence
- [ ] Completed: Handle exceptions and failure behavior
- [ ] Completed: Add unit tests including the rule's worked examples

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
- tests/fixtures/skills/business-logic-implementation.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/business-logic-implementation/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
