---
name: requirement-traceability
description: "Build and check the full traceability graph. Triggers: Phase 28."
---

# requirement-traceability

Build and check the full traceability graph.

_Scope: planning · runtime adapter: Claude_

## Procedure
1. Build goal->requirement->task->files and requirement->AC->test->evidence maps.
2. Detect orphan requirements, tasks, and acceptance criteria.
3. Validate against traceability.schema.json.

## Checklist
- [ ] Completed: Build goal->requirement->task->files and requirement->AC->test->evidence maps
- [ ] Completed: Detect orphan requirements, tasks, and acceptance criteria
- [ ] Completed: Validate against traceability

## When NOT to use
- during implementation

## Quality bar
output is specific, testable, and traceable; no vague language

## Do not
- write product code
- expose secrets
- start implementation

> Canonical definition: `system-building-os/skills/planning/requirement-traceability.md`
