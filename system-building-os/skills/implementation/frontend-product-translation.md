---
name: frontend-product-translation
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.1.0
---

# Skill: `frontend-product-translation`

**Purpose.** Translate product requirements and the intelligence matrix into concrete frontend behavior.

**Scope:** implementation  ·  **Runtime:** codex

## Invocation triggers
- frontend tasks

## When not to use
- to render product logic as generic cards/tables

## Expected inputs
- relevant plan artifacts
- task/context as applicable

## Required context
focused context packet or planning artifact set

## Outputs
- artifact(s) and/or validation results with traceable IDs

## Procedure
1. Map each user-facing requirement to the surfaces and states that express it.
2. Ensure the product's central logic is visible in the UI, not hidden.
3. Reject generic renderings of product-specific logic.

## Checklist
- [ ] Completed: Map each user-facing requirement to the surfaces and states that express it
- [ ] Completed: Ensure the product's central logic is visible in the UI, not hidden
- [ ] Completed: Reject generic renderings of product-specific logic

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
- tests/fixtures/skills/frontend-product-translation.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/frontend-product-translation/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
