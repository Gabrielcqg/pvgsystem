---
name: user-flow-planning
kind: skill
scope: planning
runtime_scope: [claude]
version: 1.1.0
---

# Skill: `user-flow-planning`

**Purpose.** Design core user journeys with success, alternative, and error paths.

**Scope:** planning  ·  **Runtime:** claude

## Invocation triggers
- Phase 8.5

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
1. For each journey assign FLOW-### and actor + trigger + preconditions.
2. Write numbered steps and system responses.
3. Define success, alternative, error, cancellation, and recovery paths.
4. List data changed, audit events, and acceptance criteria.

## Checklist
- [ ] Completed: For each journey assign FLOW-### and actor + trigger + preconditions
- [ ] Completed: Write numbered steps and system responses
- [ ] Completed: Define success, alternative, error, cancellation, and recovery paths
- [ ] Completed: List data changed, audit events, and acceptance criteria

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
- tests/fixtures/skills/user-flow-planning.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'skill', 'path': '.claude/skills/user-flow-planning/SKILL.md'}
- Codex: {'mechanism': 'n/a', 'path': None}
- Compatibility: Claude planning skill; primary planning belongs to Claude.
