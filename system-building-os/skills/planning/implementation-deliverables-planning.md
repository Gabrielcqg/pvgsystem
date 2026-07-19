---
name: implementation-deliverables-planning
kind: skill
scope: planning
runtime_scope: [claude]
version: 1.1.0
---

# Skill: `implementation-deliverables-planning`

**Purpose.** State exactly what Codex must deliver and how each deliverable is proven complete.

**Scope:** planning  ·  **Runtime:** claude

## Invocation triggers
- Phase 27 (handoff)

## When not to use
- to describe product behavior instead of deliverables

## Expected inputs
- relevant plan artifacts
- task/context as applicable

## Required context
focused context packet or planning artifact set

## Outputs
- artifact(s) and/or validation results with traceable IDs

## Procedure
1. Enumerate deliverables (frontend/backend/database/auth/ai_integration/environments/e2e/observability/docs/deployment/final_report) with DEL-### ids.
2. State expected files, runtime behavior, dependencies, configuration, tests, evidence.
3. State objective completion conditions and map each to completion gates.
4. Validate against implementation-deliverable.schema.json.

## Checklist
- [ ] Completed: Enumerate deliverables (frontend/backend/database/auth/ai_integration/environments/e2e/observability/docs/deployment/final_report) with DEL-### ids
- [ ] Completed: State expected files, runtime behavior, dependencies, configuration, tests, evidence
- [ ] Completed: State objective completion conditions and map each to completion gates
- [ ] Completed: Validate against implementation-deliverable

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
- tests/fixtures/skills/implementation-deliverables-planning.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'skill', 'path': '.claude/skills/implementation-deliverables-planning/SKILL.md'}
- Codex: {'mechanism': 'n/a', 'path': None}
- Compatibility: Claude planning skill; primary planning belongs to Claude.
