---
template_id: 24-agent-map
title: Agent Map
phase: planning
runtime: claude
produces_artifact: 20-agent-map.yaml
schema: agent-map
---

# Agent Map

## Instructions

Project-specific Codex agent map.

## Required fields / sections

- Agent id
- Responsibility
- When to use / when not to use
- Allowed tools
- Disallowed actions
- Runtime model profile
- Sandbox/permission preference
- Core/specialized skills
- MCP tools
- Input context packet
- Output contract
- Validation criteria
- Stop conditions
- File ownership

## Completeness checklist

- [ ] Every task's assigned_agent exists in the map
- [ ] Output contract per agent
- [ ] File ownership stated
- [ ] Validates against agent-map.schema.json

## Fill below

> Replace this section with the actual content for the project.
