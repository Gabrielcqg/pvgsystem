---
name: frontend-experience-grill
kind: skill
scope: planning
runtime_scope: [claude]
version: 1.1.0
---

# Skill: `frontend-experience-grill`

**Purpose.** Adversarial frontend review: product communication, IA, creativity, usability, responsiveness, visual quality.

**Scope:** planning  ·  **Runtime:** claude

## Invocation triggers
- mandatory for every product with a UI
- /plan_frontend_max

## When not to use
- to output generic design advice instead of decisions

## Expected inputs
- relevant plan artifacts
- task/context as applicable

## Required context
focused context packet or planning artifact set

## Outputs
- artifact(s) and/or validation results with traceable IDs

## Procedure
1. Challenge whether the UI communicates central value and what the AI is doing.
2. Challenge information architecture, progressive disclosure, and what deserves visualization.
3. Challenge generic-dashboard risk and identify concrete custom visualization.
4. Challenge usability, responsiveness, and visual quality (hierarchy/spacing/dead areas).
5. Emit concrete frontend decisions and a visual-quality-review verdict per dimension.

## Checklist
- [ ] Completed: Challenge whether the UI communicates central value and what the AI is doing
- [ ] Completed: Challenge information architecture, progressive disclosure, and what deserves visualization
- [ ] Completed: Challenge generic-dashboard risk and identify concrete custom visualization
- [ ] Completed: Challenge usability, responsiveness, and visual quality (hierarchy/spacing/dead areas)
- [ ] Completed: Emit concrete frontend decisions and a visual-quality-review verdict per dimension

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
- tests/fixtures/skills/frontend-experience-grill.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'skill', 'path': '.claude/skills/frontend-experience-grill/SKILL.md'}
- Codex: {'mechanism': 'n/a', 'path': None}
- Compatibility: Claude planning skill; primary planning belongs to Claude.
