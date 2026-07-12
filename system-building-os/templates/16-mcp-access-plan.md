---
template_id: 16-mcp-access-plan
title: MCP Access Plan
phase: planning
runtime: claude
produces_artifact: 12-integration-mcp-plan.md (MCP section)
schema: mcp-registry
---

# MCP Access Plan

## Instructions

Select only necessary MCPs with least privilege and separate environments.

## Required fields / sections

- Selected MCPs (from registry)
- Per-MCP registry fields
- Read vs write separation
- Environment separation (local/dev/staging/prod)
- Tool allowlists
- Blocked destructive tools
- Health checks
- Fallbacks
- Separate Claude/Codex configuration

## Completeness checklist

- [ ] Only necessary MCPs enabled
- [ ] Least privilege applied
- [ ] Env separation present
- [ ] Every MCP has a fallback
- [ ] Secrets referenced by name only
- [ ] Validates against mcp-registry.schema.json

## Fill below

> Replace this section with the actual content for the project.
