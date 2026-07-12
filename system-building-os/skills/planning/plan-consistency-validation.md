---
name: plan-consistency-validation
kind: skill
scope: planning
runtime_scope: [claude]
version: 1.0.0
---

# Skill: `plan-consistency-validation`

**Purpose.** Independently validate plan completeness and traceability before handoff.

**Scope:** planning  ·  **Runtime:** claude

## Invocation triggers
- Phase 28
- /plan_validate

## When not to use
- to rubber-stamp a plan because files exist

## Expected inputs
- relevant plan artifacts
- task/context as applicable

## Required context
focused context packet or planning artifact set

## Outputs
- artifact(s) and/or validation results with traceable IDs

## Procedure
1. Run every check in template 32 and compute a validation score.
2. List critical findings; do not mark ready with open criticals.
3. Assess content quality, not just file existence.

## Checklist
- [ ] Completed: Run every check in template 32 and compute a validation score
- [ ] Completed: List critical findings
- [ ] Completed: Assess content quality, not just file existence

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
- tests/fixtures/skills/plan-consistency-validation.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'skill', 'path': '.claude/skills/plan-consistency-validation/SKILL.md'}
- Codex: {'mechanism': 'n/a', 'path': None}
- Compatibility: Claude planning skill; primary planning belongs to Claude.
