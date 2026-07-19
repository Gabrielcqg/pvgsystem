---
name: environment-strategy
kind: skill
scope: planning
runtime_scope: [claude]
version: 1.1.0
---

# Skill: `environment-strategy`

**Purpose.** Define local, test, development, staging, and production environments.

**Scope:** planning  ·  **Runtime:** claude

## Invocation triggers
- Phase 16

## When not to use
- to place secret values anywhere

## Expected inputs
- relevant plan artifacts
- task/context as applicable

## Required context
focused context packet or planning artifact set

## Outputs
- artifact(s) and/or validation results with traceable IDs

## Procedure
1. For each environment define services, database, variables (names only).
2. Define network boundaries, access model, deployment, and migrations.
3. Define monitoring, test data, teardown, and rollback.

## Checklist
- [ ] Completed: For each environment define services, database, variables (names only)
- [ ] Completed: Define network boundaries, access model, deployment, and migrations
- [ ] Completed: Define monitoring, test data, teardown, and rollback

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
- tests/fixtures/skills/environment-strategy.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'skill', 'path': '.claude/skills/environment-strategy/SKILL.md'}
- Codex: {'mechanism': 'n/a', 'path': None}
- Compatibility: Claude planning skill; primary planning belongs to Claude.
