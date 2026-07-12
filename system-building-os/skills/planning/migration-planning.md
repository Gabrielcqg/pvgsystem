---
name: migration-planning
kind: skill
scope: planning
runtime_scope: [claude]
version: 1.0.0
---

# Skill: `migration-planning`

**Purpose.** Plan migration ordering, rollback, and drift checks.

**Scope:** planning  ·  **Runtime:** claude

## Invocation triggers
- Phase 10

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
1. Choose a migration tool/approach.
2. Define backward-compatible + expand-and-contract strategy for destructive changes.
3. Define per-migration rollback and a schema-drift check.

## Checklist
- [ ] Completed: Choose a migration tool/approach
- [ ] Completed: Define backward-compatible + expand-and-contract strategy for destructive changes
- [ ] Completed: Define per-migration rollback and a schema-drift check

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
- tests/fixtures/skills/migration-planning.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'skill', 'path': '.claude/skills/migration-planning/SKILL.md'}
- Codex: {'mechanism': 'n/a', 'path': None}
- Compatibility: Claude planning skill; primary planning belongs to Claude.
