---
name: plan-scope-guard
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.1.0
---

# Skill: `plan-scope-guard`

**Purpose.** Prevent scope creep and unauthorized product-behavior changes.

**Scope:** implementation  ·  **Runtime:** codex

## Invocation triggers
- before any code change

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
1. Compare proposed changes to the active requirements.
2. Block Level-3 (product behavior) changes; require a new plan version.
3. Allow Level 0-2 deviations with logging/ADR per the deviation policy.

## Checklist
- [ ] Completed: Compare proposed changes to the active requirements
- [ ] Completed: Block Level-3 (product behavior) changes
- [ ] Completed: Allow Level 0-2 deviations with logging/ADR per the deviation policy

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
- tests/fixtures/skills/plan-scope-guard.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/plan-scope-guard/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
