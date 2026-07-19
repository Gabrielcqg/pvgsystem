---
name: task-decomposition
kind: skill
scope: planning
runtime_scope: [claude]
version: 1.1.0
---

# Skill: `task-decomposition`

**Purpose.** Break the system into atomic, verifiable tasks.

**Scope:** planning  ·  **Runtime:** claude

## Invocation triggers
- Phase 22

## When not to use
- to write 'build the backend' as one task

## Expected inputs
- relevant plan artifacts
- task/context as applicable

## Required context
focused context packet or planning artifact set

## Outputs
- artifact(s) and/or validation results with traceable IDs

## Procedure
1. Create TASK-### entries with objective, requirements, dependencies, files.
2. Assign agent, skills, validation commands, and acceptance criteria.
3. Ensure the dependency graph is a DAG and tasks are small.
4. Validate against task-manifest.schema.json.

## Checklist
- [ ] Completed: Create TASK-### entries with objective, requirements, dependencies, files
- [ ] Completed: Assign agent, skills, validation commands, and acceptance criteria
- [ ] Completed: Ensure the dependency graph is a DAG and tasks are small
- [ ] Completed: Validate against task-manifest

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
- tests/fixtures/skills/task-decomposition.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'skill', 'path': '.claude/skills/task-decomposition/SKILL.md'}
- Codex: {'mechanism': 'n/a', 'path': None}
- Compatibility: Claude planning skill; primary planning belongs to Claude.
