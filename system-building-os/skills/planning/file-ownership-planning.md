---
name: file-ownership-planning
kind: skill
scope: planning
runtime_scope: [claude]
version: 1.1.0
---

# Skill: `file-ownership-planning`

**Purpose.** Assign file ownership and parallelization groups to prevent write conflicts.

**Scope:** planning  ·  **Runtime:** claude

## Invocation triggers
- Phase 25

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
1. Assign each owned path a mode and owner.
2. Serialize shared schema/config/manifests/routing/types/migrations.
3. Parallelize independent modules and read-only reviews.
4. Validate against file-ownership.schema.json.

## Checklist
- [ ] Completed: Assign each owned path a mode and owner
- [ ] Completed: Serialize shared schema/config/manifests/routing/types/migrations
- [ ] Completed: Parallelize independent modules and read-only reviews
- [ ] Completed: Validate against file-ownership

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
- tests/fixtures/skills/file-ownership-planning.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'skill', 'path': '.claude/skills/file-ownership-planning/SKILL.md'}
- Codex: {'mechanism': 'n/a', 'path': None}
- Compatibility: Claude planning skill; primary planning belongs to Claude.
