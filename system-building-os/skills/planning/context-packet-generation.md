---
name: context-packet-generation
kind: skill
scope: planning
runtime_scope: [claude]
version: 1.0.0
---

# Skill: `context-packet-generation`

**Purpose.** Produce a focused context packet per task.

**Scope:** planning  ·  **Runtime:** claude

## Invocation triggers
- Phase 27

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
1. Include only the task's requirements, architecture, files, tests, skills, MCP tools.
2. State the output contract and stop conditions.
3. Never include the entire planning corpus.

## Checklist
- [ ] Completed: Include only the task's requirements, architecture, files, tests, skills, MCP tools
- [ ] Completed: State the output contract and stop conditions
- [ ] Completed: Never include the entire planning corpus

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
- tests/fixtures/skills/context-packet-generation.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'skill', 'path': '.claude/skills/context-packet-generation/SKILL.md'}
- Codex: {'mechanism': 'n/a', 'path': None}
- Compatibility: Claude planning skill; primary planning belongs to Claude.
