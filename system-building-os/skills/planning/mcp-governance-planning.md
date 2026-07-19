---
name: mcp-governance-planning
kind: skill
scope: planning
runtime_scope: [claude]
version: 1.1.0
---

# Skill: `mcp-governance-planning`

**Purpose.** Select and govern MCPs with least privilege.

**Scope:** planning  ·  **Runtime:** claude

## Invocation triggers
- Phase 20

## When not to use
- to enable every MCP globally

## Expected inputs
- relevant plan artifacts
- task/context as applicable

## Required context
focused context packet or planning artifact set

## Outputs
- artifact(s) and/or validation results with traceable IDs

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
- tests/fixtures/skills/mcp-governance-planning.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'skill', 'path': '.claude/skills/mcp-governance-planning/SKILL.md'}
- Codex: {'mechanism': 'n/a', 'path': None}
- Compatibility: Claude planning skill; primary planning belongs to Claude.
