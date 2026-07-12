---
name: infrastructure-planning
kind: skill
scope: planning
runtime_scope: [claude]
version: 1.0.0
---

# Skill: `infrastructure-planning`

**Purpose.** Plan containers, IaC, hosting, CI/CD, backups, and disaster recovery.

**Scope:** planning  ·  **Runtime:** claude

## Invocation triggers
- Phase 16

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
1. Define container + IaC strategy and hosting.
2. Define workers, queues, schedules, storage, and backups.
3. Define CI/CD, release, rollback, and disaster recovery.

## Checklist
- [ ] Completed: Define container + IaC strategy and hosting
- [ ] Completed: Define workers, queues, schedules, storage, and backups
- [ ] Completed: Define CI/CD, release, rollback, and disaster recovery

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
- tests/fixtures/skills/infrastructure-planning.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'skill', 'path': '.claude/skills/infrastructure-planning/SKILL.md'}
- Codex: {'mechanism': 'n/a', 'path': None}
- Compatibility: Claude planning skill; primary planning belongs to Claude.
