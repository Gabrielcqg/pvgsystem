---
name: frontend-design-system
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.1.0
---

# Skill: `frontend-design-system`

**Purpose.** Implement the design system and tokens (color, type, spacing, motion) from the plan.

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
1. Implement design tokens and primitives from frontend/design-tokens.yaml.
2. Build reusable components with consistent spacing, type scale, and states.
3. Keep tokens the single source of visual truth.

## Checklist
- [ ] Completed: Implement design tokens and primitives from frontend/design-tokens
- [ ] Completed: Build reusable components with consistent spacing, type scale, and states
- [ ] Completed: Keep tokens the single source of visual truth

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
- tests/fixtures/skills/frontend-design-system.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/frontend-design-system/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
