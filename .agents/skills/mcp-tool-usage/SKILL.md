---
name: mcp-tool-usage
description: Use MCP tools within governed least-privilege boundaries.
---

# mcp-tool-usage (Codex skill)

Use MCP tools within governed least-privilege boundaries.

_Scope: implementation · runtime adapter: Codex_

## Procedure (runnable)
1. Use only allowlisted tools for the current environment.
2. Never use disabled/destructive tools.
3. Fall back to the local equivalent when the MCP is unavailable.

## Inputs it may rely on
- relevant plan artifacts
- task/context as applicable

## Files it may own
Determined by the assigned task's `files_to_create`/`files_to_modify`.
## Files it must not touch
Anything outside the task's ownership or in protected paths.

## Validations it must run
- read
- write
- run_tests
- run_validations

## Success
output is specific, testable, and traceable; no vague language

## Failure / escalate to recovery
- missing required fields
- vague/untestable output
- secret exposure
- scope violation

## Return control to supervisor when
the procedure completes or the failure budget is exhausted.

> Canonical definition: `system-building-os/skills/implementation/mcp-tool-usage.md`
