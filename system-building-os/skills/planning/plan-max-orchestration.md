---
name: plan-max-orchestration
kind: skill
scope: planning
runtime_scope: [claude]
version: 1.0.0
---

# Skill: `plan-max-orchestration`

**Purpose.** Drive the full /plan_max pipeline (Phases 0-28) and produce the Codex package.

**Scope:** planning  ·  **Runtime:** claude

## Invocation triggers
- /plan_max invoked
- /plan_resume

## When not to use
- during implementation
- to write product code

## Expected inputs
- relevant plan artifacts
- task/context as applicable

## Required context
focused context packet or planning artifact set

## Outputs
- artifact(s) and/or validation results with traceable IDs

## Procedure
1. Run Phase 0 repository/context preflight and set state RECEIVED->UNDERSTANDING.
2. Normalize intent (Phase 1); invoke grill-me-planning three passes (Phases 2-4).
3. Classify gaps with decision-resolution; resolve A-D, group E questions only.
4. Invoke domain planning agents/skills for every system dimension.
5. Assemble the numbered plan package under plans/active/<slug>/.
6. Invoke plan-consistency-validation; only mark IMPLEMENTATION_READY when it passes.

## Checklist
- [ ] Completed: Run Phase 0 repository/context preflight and set state RECEIVED->UNDERSTANDING
- [ ] Completed: Normalize intent (Phase 1)
- [ ] Completed: Classify gaps with decision-resolution
- [ ] Completed: Invoke domain planning agents/skills for every system dimension
- [ ] Completed: Assemble the numbered plan package under plans/active/<slug>/
- [ ] Completed: Invoke plan-consistency-validation

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
- tests/fixtures/skills/plan-max-orchestration.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'skill', 'path': '.claude/skills/plan-max-orchestration/SKILL.md'}
- Codex: {'mechanism': 'n/a', 'path': None}
- Compatibility: Claude planning skill; primary planning belongs to Claude.
