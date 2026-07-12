---
name: mcp-tool-usage
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.0.0
---

# Skill: `mcp-tool-usage`

**Purpose.** Use MCP tools within governed least-privilege boundaries.

**Scope:** implementation  ·  **Runtime:** codex

## Invocation triggers
- tasks using MCP-backed workflows

## When not to use
- production writes without guards

## Expected inputs
- relevant plan artifacts
- task/context as applicable

## Required context
focused context packet or planning artifact set

## Outputs
- artifact(s) and/or validation results with traceable IDs

## Procedure
1. Use only allowlisted tools for the current environment.
2. Never use disabled/destructive tools.
3. Fall back to the local equivalent when the MCP is unavailable.

## Checklist
- [ ] Completed: Use only allowlisted tools for the current environment
- [ ] Completed: Never use disabled/destructive tools
- [ ] Completed: Fall back to the local equivalent when the MCP is unavailable

## Quality bar
output is specific, testable, and traceable; no vague language

## Failure conditions
- missing required fields
- vague/untestable output
- secret exposure
- scope violation

## Allowed tools
- read
- write
- run_tests
- run_validations

## Disallowed actions
- expose secrets
- reinterpret product scope

## Tool access
implementation (read/write/run)

## Test fixtures
- tests/fixtures/skills/mcp-tool-usage.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/mcp-tool-usage/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
