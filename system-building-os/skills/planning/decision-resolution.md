---
name: decision-resolution
kind: skill
scope: planning
runtime_scope: [claude]
version: 1.0.0
---

# Skill: `decision-resolution`

**Purpose.** Classify every gap into Categories A-F and resolve or escalate correctly.

**Scope:** planning  ·  **Runtime:** claude

## Invocation triggers
- Phase 5-6

## When not to use
- to ask questions Claude can answer itself

## Expected inputs
- relevant plan artifacts
- task/context as applicable

## Required context
focused context packet or planning artifact set

## Outputs
- artifact(s) and/or validation results with traceable IDs

## Procedure
1. Classify each missing decision A/B/C/D/E/F.
2. Resolve A-D autonomously; record C/D in the decision ledger.
3. Group all E questions into one round with recommended defaults.
4. Treat F as an external dependency, not a planning ambiguity.

## Checklist
- [ ] Completed: Classify each missing decision A/B/C/D/E/F
- [ ] Completed: Resolve A-D autonomously
- [ ] Completed: Group all E questions into one round with recommended defaults
- [ ] Completed: Treat F as an external dependency, not a planning ambiguity

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
- tests/fixtures/skills/decision-resolution.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'skill', 'path': '.claude/skills/decision-resolution/SKILL.md'}
- Codex: {'mechanism': 'n/a', 'path': None}
- Compatibility: Claude planning skill; primary planning belongs to Claude.
