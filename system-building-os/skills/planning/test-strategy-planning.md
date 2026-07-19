---
name: test-strategy-planning
kind: skill
scope: planning
runtime_scope: [claude]
version: 1.1.0
---

# Skill: `test-strategy-planning`

**Purpose.** Plan the full test pyramid and map every acceptance criterion to a test.

**Scope:** planning  ·  **Runtime:** claude

## Invocation triggers
- Phase 19

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
1. Define static analysis, unit, integration, contract, DB, auth, AI, E2E, a11y tests.
2. Map each AC-### to >=1 TEST-###.
3. Identify where manual QA is required.

## Checklist
- [ ] Completed: Define static analysis, unit, integration, contract, DB, auth, AI, E2E, a11y tests
- [ ] Completed: Map each AC-### to >=1 TEST-###
- [ ] Completed: Identify where manual QA is required

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
- tests/fixtures/skills/test-strategy-planning.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'skill', 'path': '.claude/skills/test-strategy-planning/SKILL.md'}
- Codex: {'mechanism': 'n/a', 'path': None}
- Compatibility: Claude planning skill; primary planning belongs to Claude.
