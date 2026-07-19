---
name: creative-ui-concept
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.1.0
---

# Skill: `creative-ui-concept`

**Purpose.** Realize the product's differentiating visual/interaction concept, not a generic dashboard.

**Scope:** implementation  ·  **Runtime:** codex

## Invocation triggers
- frontend tasks with a visual bar

## When not to use
- to ship a generic admin dashboard

## Expected inputs
- relevant plan artifacts
- task/context as applicable

## Required context
focused context packet or planning artifact set

## Outputs
- artifact(s) and/or validation results with traceable IDs

## Procedure
1. Implement the custom visualization/interaction identified in the frontend grill.
2. Use timelines/process maps/comparisons/scores/simulations where the plan calls for them.
3. Avoid dead space and cards stretched only to fill containers.

## Checklist
- [ ] Completed: Implement the custom visualization/interaction identified in the frontend grill
- [ ] Completed: Use timelines/process maps/comparisons/scores/simulations where the plan calls for them
- [ ] Completed: Avoid dead space and cards stretched only to fill containers

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
- tests/fixtures/skills/creative-ui-concept.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/creative-ui-concept/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
