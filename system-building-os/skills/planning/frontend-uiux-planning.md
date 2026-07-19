---
name: frontend-uiux-planning
kind: skill
scope: planning
runtime_scope: [claude]
version: 1.1.0
---

# Skill: `frontend-uiux-planning`

**Purpose.** Design screens and interactions with all states.

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
1. For each screen assign UI-### and define layout, components, primary action.
2. Define default/loading/empty/error/success/disabled/partial-data states.
3. Define responsive, keyboard, accessibility, motion, and visual acceptance criteria.
4. Consider community front-design skills; fall back to this skill if absent.

## Checklist
- [ ] Completed: For each screen assign UI-### and define layout, components, primary action
- [ ] Completed: Define default/loading/empty/error/success/disabled/partial-data states
- [ ] Completed: Define responsive, keyboard, accessibility, motion, and visual acceptance criteria
- [ ] Completed: Consider community front-design skills

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
- tests/fixtures/skills/frontend-uiux-planning.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'skill', 'path': '.claude/skills/frontend-uiux-planning/SKILL.md'}
- Codex: {'mechanism': 'n/a', 'path': None}
- Compatibility: Claude planning skill; primary planning belongs to Claude.
