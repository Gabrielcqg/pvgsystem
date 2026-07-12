---
name: auth-implementation
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.0.0
---

# Skill: `auth-implementation`

**Purpose.** Implement authentication and session management.

**Scope:** implementation  ·  **Runtime:** codex

## Invocation triggers
- auth tasks

## When not to use
- during product discovery

## Expected inputs
- relevant plan artifacts
- task/context as applicable

## Required context
focused context packet or planning artifact set

## Outputs
- artifact(s) and/or validation results with traceable IDs

## Procedure
1. Implement account lifecycle, login/logout, and sessions.
2. Reference secrets by env-var name only.
3. Add auth tests covering success and failure paths.

## Checklist
- [ ] Completed: Implement account lifecycle, login/logout, and sessions
- [ ] Completed: Reference secrets by env-var name only
- [ ] Completed: Add auth tests covering success and failure paths

## Quality bar
output is specific, testable, and traceable; no vague language

## Failure conditions
- missing required fields
- vague/untestable output
- secret exposure
- scope violation

## Allowed tools
- read
- write
- run_tests
- run_validations

## Disallowed actions
- expose secrets
- reinterpret product scope

## Tool access
implementation (read/write/run)

## Test fixtures
- tests/fixtures/skills/auth-implementation.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/auth-implementation/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
