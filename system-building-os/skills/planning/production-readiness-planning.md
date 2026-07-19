---
name: production-readiness-planning
kind: skill
scope: planning
runtime_scope: [claude]
version: 1.1.0
---

# Skill: `production-readiness-planning`

**Purpose.** Prove every applicable vertical layer is planned, gated, and not superficial or deferred.

**Scope:** planning  ·  **Runtime:** claude

## Invocation triggers
- Phase 27-28

## When not to use
- to mark IMPLEMENTATION_READY with an applicable layer missing

## Expected inputs
- relevant plan artifacts
- task/context as applicable

## Required context
focused context packet or planning artifact set

## Outputs
- artifact(s) and/or validation results with traceable IDs

## Procedure
1. Enumerate all layers and mark applicability + planned + implementation gate.
2. Require frontend when UI exists, DB when persistence, auth when private/roles, real AI path when AI is central.
3. Define the production-like run steps Codex must execute.
4. Fail readiness when an applicable layer is omitted, superficial, or delegated to Codex.
5. Validate against production-readiness + production-like-run schemas.

## Checklist
- [ ] Completed: Enumerate all layers and mark applicability + planned + implementation gate
- [ ] Completed: Require frontend when UI exists, DB when persistence, auth when private/roles, real AI path when AI is central
- [ ] Completed: Define the production-like run steps Codex must execute
- [ ] Completed: Fail readiness when an applicable layer is omitted, superficial, or delegated to Codex
- [ ] Completed: Validate against production-readiness + production-like-run schemas

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
- tests/fixtures/skills/production-readiness-planning.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'skill', 'path': '.claude/skills/production-readiness-planning/SKILL.md'}
- Codex: {'mechanism': 'n/a', 'path': None}
- Compatibility: Claude planning skill; primary planning belongs to Claude.
