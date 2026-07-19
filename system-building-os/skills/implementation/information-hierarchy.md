---
name: information-hierarchy
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.1.0
---

# Skill: `information-hierarchy`

**Purpose.** Implement meaningful information hierarchy and progressive disclosure.

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
1. Make primary information primary and supporting information secondary.
2. Apply progressive disclosure; hide advanced controls appropriately.
3. Verify hierarchy against the frontend plan.

## Checklist
- [ ] Completed: Make primary information primary and supporting information secondary
- [ ] Completed: Apply progressive disclosure
- [ ] Completed: Verify hierarchy against the frontend plan

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
- tests/fixtures/skills/information-hierarchy.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/information-hierarchy/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
