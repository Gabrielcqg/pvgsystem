---
name: design-reference-compliance
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.1.0
---

# Skill: `design-reference-compliance`

**Purpose.** Verify the implemented UI follows the frontend reference package.

**Scope:** implementation  ·  **Runtime:** codex

## Invocation triggers
- frontend review
- REVIEWING state

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
1. Compare implementation to MUST_FOLLOW references and non-negotiable visual rules.
2. Flag AVOID patterns that slipped in.
3. Record compliance evidence for the frontend experience review.

## Checklist
- [ ] Completed: Compare implementation to MUST_FOLLOW references and non-negotiable visual rules
- [ ] Completed: Flag AVOID patterns that slipped in
- [ ] Completed: Record compliance evidence for the frontend experience review

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
- tests/fixtures/skills/design-reference-compliance.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/design-reference-compliance/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
