---
name: task-decomposition
description: "Break the system into atomic, verifiable tasks. Triggers: Phase 22."
---

# task-decomposition

Break the system into atomic, verifiable tasks.

_Scope: planning · runtime adapter: Claude_

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

## When NOT to use
- to write 'build the backend' as one task

## Quality bar
output is specific, testable, and traceable; no vague language

## Do not
- write product code
- expose secrets
- start implementation

> Canonical definition: `system-building-os/skills/planning/task-decomposition.md`
