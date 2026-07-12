---
name: integration-planning
kind: skill
scope: planning
runtime_scope: [claude]
version: 1.0.0
---

# Skill: `integration-planning`

**Purpose.** Specify external integrations with fallback and mock strategy.

**Scope:** planning  ·  **Runtime:** claude

## Invocation triggers
- Phase 13

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
1. Assign INT-### and define auth, data in/out, triggers, timeouts, retries.
2. Define failure behavior, fallback, sandbox, and mock strategy.
3. Define contract tests.

## Checklist
- [ ] Completed: Assign INT-### and define auth, data in/out, triggers, timeouts, retries
- [ ] Completed: Define failure behavior, fallback, sandbox, and mock strategy
- [ ] Completed: Define contract tests

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
- tests/fixtures/skills/integration-planning.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'skill', 'path': '.claude/skills/integration-planning/SKILL.md'}
- Codex: {'mechanism': 'n/a', 'path': None}
- Compatibility: Claude planning skill; primary planning belongs to Claude.
