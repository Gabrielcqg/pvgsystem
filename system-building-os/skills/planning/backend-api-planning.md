---
name: backend-api-planning
kind: skill
scope: planning
runtime_scope: [claude]
version: 1.0.0
---

# Skill: `backend-api-planning`

**Purpose.** Design domain services and API contracts.

**Scope:** planning  ·  **Runtime:** claude

## Invocation triggers
- Phase 11 & 13

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
1. Define domain modules, service boundaries, and the error model.
2. Specify every endpoint (API-###) with request/response schemas and codes.
3. Define idempotency, side effects, events, jobs, queues, observability, tests.

## Checklist
- [ ] Completed: Define domain modules, service boundaries, and the error model
- [ ] Completed: Specify every endpoint (API-###) with request/response schemas and codes
- [ ] Completed: Define idempotency, side effects, events, jobs, queues, observability, tests

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
- tests/fixtures/skills/backend-api-planning.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'skill', 'path': '.claude/skills/backend-api-planning/SKILL.md'}
- Codex: {'mechanism': 'n/a', 'path': None}
- Compatibility: Claude planning skill; primary planning belongs to Claude.
