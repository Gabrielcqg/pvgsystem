---
name: frontend-design-fidelity
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.0.0
---

# Skill: `frontend-design-fidelity`

**Purpose.** Match the implementation to the design direction and tokens.

**Scope:** implementation  ·  **Runtime:** codex

## Invocation triggers
- frontend tasks with a visual bar

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
1. Apply design tokens (type, spacing, grid, color).
2. Verify hierarchy, alignment, and motion against the plan.
3. Capture before/after evidence for visual acceptance criteria.

## Checklist
- [ ] Completed: Apply design tokens (type, spacing, grid, color)
- [ ] Completed: Verify hierarchy, alignment, and motion against the plan
- [ ] Completed: Capture before/after evidence for visual acceptance criteria

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
- tests/fixtures/skills/frontend-design-fidelity.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/frontend-design-fidelity/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
