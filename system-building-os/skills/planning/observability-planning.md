---
name: observability-planning
kind: skill
scope: planning
runtime_scope: [claude]
version: 1.1.0
---

# Skill: `observability-planning`

**Purpose.** Plan logs, metrics, traces, dashboards, and alerts with redaction.

**Scope:** planning  ·  **Runtime:** claude

## Invocation triggers
- Phase 17

## When not to use
- during implementation

## Expected inputs
- relevant plan artifacts
- task/context as applicable

## Required context
focused context packet or planning artifact set

## Outputs
- artifact(s) and/or validation results with traceable IDs

## Procedure
1. Define structured log fields and correlation IDs.
2. Define metrics, traces, dashboards, and alerts.
3. Define AI cost/latency, MCP operations, audit events, retention, redaction.

## Checklist
- [ ] Completed: Define structured log fields and correlation IDs
- [ ] Completed: Define metrics, traces, dashboards, and alerts
- [ ] Completed: Define AI cost/latency, MCP operations, audit events, retention, redaction

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
- tests/fixtures/skills/observability-planning.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'skill', 'path': '.claude/skills/observability-planning/SKILL.md'}
- Codex: {'mechanism': 'n/a', 'path': None}
- Compatibility: Claude planning skill; primary planning belongs to Claude.
