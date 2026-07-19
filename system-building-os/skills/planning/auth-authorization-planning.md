---
name: auth-authorization-planning
kind: skill
scope: planning
runtime_scope: [claude]
version: 1.1.0
---

# Skill: `auth-authorization-planning`

**Purpose.** Design identity, sessions, and the authorization model.

**Scope:** planning  ·  **Runtime:** claude

## Invocation triggers
- Phase 14

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
1. Decide auth methods and account lifecycle.
2. Define session/token strategy, recovery, verification.
3. Enumerate roles (AUTH-###), permissions, boundaries, privileged actions, audit.

## Checklist
- [ ] Completed: Decide auth methods and account lifecycle
- [ ] Completed: Define session/token strategy, recovery, verification
- [ ] Completed: Enumerate roles (AUTH-###), permissions, boundaries, privileged actions, audit

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
- tests/fixtures/skills/auth-authorization-planning.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'skill', 'path': '.claude/skills/auth-authorization-planning/SKILL.md'}
- Codex: {'mechanism': 'n/a', 'path': None}
- Compatibility: Claude planning skill; primary planning belongs to Claude.
