---
name: agent-assignment
description: "Assign each task to a Codex agent and produce the agent map. Triggers: Phase 23."
---

# agent-assignment

Assign each task to a Codex agent and produce the agent map.

_Scope: planning · runtime adapter: Claude_

## Procedure
1. Map each task to exactly one assigned agent.
2. Define per-agent tools, model profile, and file ownership.
3. Validate against agent-map.schema.json.

## Checklist
- [ ] Completed: Map each task to exactly one assigned agent
- [ ] Completed: Define per-agent tools, model profile, and file ownership
- [ ] Completed: Validate against agent-map

## When NOT to use
- during implementation

## Quality bar
output is specific, testable, and traceable; no vague language

## Do not
- write product code
- expose secrets
- start implementation

> Canonical definition: `system-building-os/skills/planning/agent-assignment.md`
