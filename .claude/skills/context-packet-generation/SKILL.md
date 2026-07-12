---
name: context-packet-generation
description: "Produce a focused context packet per task. Triggers: Phase 27."
---

# context-packet-generation

Produce a focused context packet per task.

_Scope: planning · runtime adapter: Claude_

## Procedure
1. Include only the task's requirements, architecture, files, tests, skills, MCP tools.
2. State the output contract and stop conditions.
3. Never include the entire planning corpus.

## Checklist
- [ ] Completed: Include only the task's requirements, architecture, files, tests, skills, MCP tools
- [ ] Completed: State the output contract and stop conditions
- [ ] Completed: Never include the entire planning corpus

## When NOT to use
- during implementation

## Quality bar
output is specific, testable, and traceable; no vague language

## Do not
- write product code
- expose secrets
- start implementation

> Canonical definition: `system-building-os/skills/planning/context-packet-generation.md`
