---
name: grill-me-planning
kind: skill
scope: planning
runtime_scope: [claude]
version: 1.1.0
---

# Skill: `grill-me-planning`

**Purpose.** Adversarial interrogation of the product and plan; produce concrete findings, not ceremony.

**Scope:** planning  ·  **Runtime:** claude

## Invocation triggers
- every planning request
- /grill_max

## When not to use
- never skip; it is mandatory for every plan

## Expected inputs
- relevant plan artifacts
- task/context as applicable

## Required context
focused context packet or planning artifact set

## Outputs
- artifact(s) and/or validation results with traceable IDs

## Procedure
1. Pass 1 (product reality): is the stated problem the real problem? who has it? why now?
2. Pass 2 (system completeness): sweep every dimension (users..rollback) for gaps.
3. Pass 3 (implementation ambiguity): could Codex implement without guessing?
4. Record findings with severity and the requirement/area they affect.
5. Emit high-value questions only for material product ambiguity (Category E).

## Checklist
- [ ] Completed: Pass 1 (product reality): is the stated problem the real problem? who has it? why now?
- [ ] Completed: Pass 2 (system completeness): sweep every dimension (users
- [ ] Completed: Pass 3 (implementation ambiguity): could Codex implement without guessing?
- [ ] Completed: Record findings with severity and the requirement/area they affect
- [ ] Completed: Emit high-value questions only for material product ambiguity (Category E)

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
- tests/fixtures/skills/grill-me-planning.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'skill', 'path': '.claude/skills/grill-me-planning/SKILL.md'}
- Codex: {'mechanism': 'n/a', 'path': None}
- Compatibility: Claude planning skill; primary planning belongs to Claude.
