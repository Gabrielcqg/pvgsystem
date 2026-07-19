---
name: accessibility-planning
kind: skill
scope: planning
runtime_scope: [claude]
version: 1.1.0
---

# Skill: `accessibility-planning`

**Purpose.** Plan accessibility to a stated conformance target.

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
1. Choose a conformance target (e.g. WCAG 2.2 AA).
2. Define focus order, labels, roles, contrast, and keyboard operability per screen.
3. Define accessibility acceptance criteria and test approach.

## Checklist
- [ ] Completed: Choose a conformance target (e
- [ ] Completed: Define focus order, labels, roles, contrast, and keyboard operability per screen
- [ ] Completed: Define accessibility acceptance criteria and test approach

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
- tests/fixtures/skills/accessibility-planning.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'skill', 'path': '.claude/skills/accessibility-planning/SKILL.md'}
- Codex: {'mechanism': 'n/a', 'path': None}
- Compatibility: Claude planning skill; primary planning belongs to Claude.
