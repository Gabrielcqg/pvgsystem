---
name: frontend-backend-contract-planning
kind: skill
scope: planning
runtime_scope: [claude]
version: 1.1.0
---

# Skill: `frontend-backend-contract-planning`

**Purpose.** Bind every frontend interaction to its backend/local behavior end to end.

**Scope:** planning  ·  **Runtime:** claude

## Invocation triggers
- Phase 12-13 reconciliation

## When not to use
- to leave a button without an implementation contract

## Expected inputs
- relevant plan artifacts
- task/context as applicable

## Required context
focused context packet or planning artifact set

## Outputs
- artifact(s) and/or validation results with traceable IDs

## Procedure
1. For each user action emit an IX-### interaction contract.
2. Define request contract, backend handler, business rule, AI behavior, database effect.
3. Define success + error responses, loading/streaming/retry/optimistic behavior, feedback.
4. Reject buttons with no contract and user-visible backend features with no surface.
5. Validate against interaction-contract.schema.json.

## Checklist
- [ ] Completed: For each user action emit an IX-### interaction contract
- [ ] Completed: Define request contract, backend handler, business rule, AI behavior, database effect
- [ ] Completed: Define success + error responses, loading/streaming/retry/optimistic behavior, feedback
- [ ] Completed: Reject buttons with no contract and user-visible backend features with no surface
- [ ] Completed: Validate against interaction-contract

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
- tests/fixtures/skills/frontend-backend-contract-planning.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'skill', 'path': '.claude/skills/frontend-backend-contract-planning/SKILL.md'}
- Codex: {'mechanism': 'n/a', 'path': None}
- Compatibility: Claude planning skill; primary planning belongs to Claude.
