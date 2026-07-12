---
name: motion-performance-planning
kind: skill
scope: planning
runtime_scope: [claude]
version: 1.0.0
---

# Skill: `motion-performance-planning`

**Purpose.** Plan motion and perceived performance.

**Scope:** planning  ·  **Runtime:** claude

## Invocation triggers
- Phase 12

## When not to use
- during implementation

## Expected inputs
- relevant plan artifacts
- task/context as applicable

## Required context
focused context packet or planning artifact set

## Outputs
- artifact(s) and/or validation results with traceable IDs

## Procedure
1. Define motion principles, durations, and reduced-motion behavior.
2. Define perceived-performance techniques (skeletons, optimistic UI).
3. Attach animation acceptance criteria.

## Checklist
- [ ] Completed: Define motion principles, durations, and reduced-motion behavior
- [ ] Completed: Define perceived-performance techniques (skeletons, optimistic UI)
- [ ] Completed: Attach animation acceptance criteria

## Quality bar
output is specific, testable, and traceable; no vague language

## Failure conditions
- missing required fields
- vague/untestable output
- secret exposure
- scope violation

## Allowed tools
- read
- write_planning_artifacts
- search

## Disallowed actions
- write product code
- expose secrets
- start implementation

## Tool access
planning (read + write artifacts)

## Test fixtures
- tests/fixtures/skills/motion-performance-planning.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'skill', 'path': '.claude/skills/motion-performance-planning/SKILL.md'}
- Codex: {'mechanism': 'n/a', 'path': None}
- Compatibility: Claude planning skill; primary planning belongs to Claude.
