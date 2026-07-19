---
name: database-selection
kind: skill
scope: planning
runtime_scope: [claude]
version: 1.1.0
---

# Skill: `database-selection`

**Purpose.** Select the database from requirements, not by default.

**Scope:** planning  ·  **Runtime:** claude

## Invocation triggers
- Phase 10

## When not to use
- to force one database on every project

## Expected inputs
- relevant plan artifacts
- task/context as applicable

## Required context
focused context packet or planning artifact set

## Outputs
- artifact(s) and/or validation results with traceable IDs

## Procedure
1. Map requirements to relational/document/kv/graph/vector/search/cache needs.
2. Recommend a database + provider with rationale and alternatives.
3. Define local/test/staging/production database strategy.

## Checklist
- [ ] Completed: Map requirements to relational/document/kv/graph/vector/search/cache needs
- [ ] Completed: Recommend a database + provider with rationale and alternatives
- [ ] Completed: Define local/test/staging/production database strategy

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
- tests/fixtures/skills/database-selection.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'skill', 'path': '.claude/skills/database-selection/SKILL.md'}
- Codex: {'mechanism': 'n/a', 'path': None}
- Compatibility: Claude planning skill; primary planning belongs to Claude.
