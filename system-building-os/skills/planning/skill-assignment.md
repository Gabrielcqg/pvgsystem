---
name: skill-assignment
kind: skill
scope: planning
runtime_scope: [claude]
version: 1.0.0
---

# Skill: `skill-assignment`

**Purpose.** Classify and assign skills; ensure local fallbacks.

**Scope:** planning  ·  **Runtime:** claude

## Invocation triggers
- Phase 24

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
1. Classify each skill core/project/community/local-fallback/new.
2. Ensure every community skill has a local fallback.
3. Validate against skill-map.schema.json.

## Checklist
- [ ] Completed: Classify each skill core/project/community/local-fallback/new
- [ ] Completed: Ensure every community skill has a local fallback
- [ ] Completed: Validate against skill-map

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
- tests/fixtures/skills/skill-assignment.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'skill', 'path': '.claude/skills/skill-assignment/SKILL.md'}
- Codex: {'mechanism': 'n/a', 'path': None}
- Compatibility: Claude planning skill; primary planning belongs to Claude.
