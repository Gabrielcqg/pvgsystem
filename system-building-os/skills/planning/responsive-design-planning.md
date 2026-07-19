---
name: responsive-design-planning
kind: skill
scope: planning
runtime_scope: [claude]
version: 1.1.0
---

# Skill: `responsive-design-planning`

**Purpose.** Define responsive breakpoints and layout behavior.

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
1. Define breakpoints and per-breakpoint layout for each screen.
2. Define touch/keyboard behavior and reflow rules.
3. Define acceptance criteria for small/medium/large viewports.

## Checklist
- [ ] Completed: Define breakpoints and per-breakpoint layout for each screen
- [ ] Completed: Define touch/keyboard behavior and reflow rules
- [ ] Completed: Define acceptance criteria for small/medium/large viewports

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
- tests/fixtures/skills/responsive-design-planning.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'skill', 'path': '.claude/skills/responsive-design-planning/SKILL.md'}
- Codex: {'mechanism': 'n/a', 'path': None}
- Compatibility: Claude planning skill; primary planning belongs to Claude.
