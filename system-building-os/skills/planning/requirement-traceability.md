---
name: requirement-traceability
kind: skill
scope: planning
runtime_scope: [claude]
version: 1.0.0
---

# Skill: `requirement-traceability`

**Purpose.** Build and check the full traceability graph.

**Scope:** planning  ·  **Runtime:** claude

## Invocation triggers
- Phase 28

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
1. Build goal->requirement->task->files and requirement->AC->test->evidence maps.
2. Detect orphan requirements, tasks, and acceptance criteria.
3. Validate against traceability.schema.json.

## Checklist
- [ ] Completed: Build goal->requirement->task->files and requirement->AC->test->evidence maps
- [ ] Completed: Detect orphan requirements, tasks, and acceptance criteria
- [ ] Completed: Validate against traceability

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
- tests/fixtures/skills/requirement-traceability.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'skill', 'path': '.claude/skills/requirement-traceability/SKILL.md'}
- Codex: {'mechanism': 'n/a', 'path': None}
- Compatibility: Claude planning skill; primary planning belongs to Claude.
