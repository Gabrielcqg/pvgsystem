---
name: data-architecture-planning
kind: skill
scope: planning
runtime_scope: [claude]
version: 1.1.0
---

# Skill: `data-architecture-planning`

**Purpose.** Design the data model and produce a machine-readable representation.

**Scope:** planning  ·  **Runtime:** claude

## Invocation triggers
- Phase 10

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
1. Decide persistence need and database kind(s).
2. Define entities (DB-###), fields, types, relationships, constraints, indexes.
3. Mark ownership, classification, personal data, retention.
4. Emit data-model.yaml validating against data-model.schema.json.

## Checklist
- [ ] Completed: Decide persistence need and database kind(s)
- [ ] Completed: Define entities (DB-###), fields, types, relationships, constraints, indexes
- [ ] Completed: Mark ownership, classification, personal data, retention
- [ ] Completed: Emit data-model

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
- tests/fixtures/skills/data-architecture-planning.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'skill', 'path': '.claude/skills/data-architecture-planning/SKILL.md'}
- Codex: {'mechanism': 'n/a', 'path': None}
- Compatibility: Claude planning skill; primary planning belongs to Claude.
