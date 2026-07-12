---
name: mcp-governance-planning
description: "Select and govern MCPs with least privilege. Triggers: Phase 20."
---

# mcp-governance-planning

Select and govern MCPs with least privilege.

_Scope: planning · runtime adapter: Claude_

## Procedure
1. Select only necessary MCPs from the registry.
2. Apply least privilege, read/write separation, and environment separation.
3. Define tool allowlists, blocked destructive tools, health checks, fallbacks.
4. Generate separate Claude and Codex MCP configuration.

## Checklist
- [ ] Completed: Select only necessary MCPs from the registry
- [ ] Completed: Apply least privilege, read/write separation, and environment separation
- [ ] Completed: Define tool allowlists, blocked destructive tools, health checks, fallbacks
- [ ] Completed: Generate separate Claude and Codex MCP configuration

## When NOT to use
- to enable every MCP globally

## Quality bar
output is specific, testable, and traceable; no vague language

## Do not
- write product code
- expose secrets
- start implementation

> Canonical definition: `system-building-os/skills/planning/mcp-governance-planning.md`
