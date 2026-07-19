---
name: animation-and-microinteraction
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.1.0
---

# Skill: `animation-and-microinteraction`

**Purpose.** Implement motion, transitions, and microinteractions with reduced-motion support.

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
1. Implement transitions and feedback per the motion plan.
2. Respect prefers-reduced-motion.
3. Keep durations/easings consistent with design tokens.

## Checklist
- [ ] Completed: Implement transitions and feedback per the motion plan
- [ ] Completed: Respect prefers-reduced-motion
- [ ] Completed: Keep durations/easings consistent with design tokens

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
- tests/fixtures/skills/animation-and-microinteraction.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/animation-and-microinteraction/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
