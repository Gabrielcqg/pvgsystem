---
name: agent-assignment
kind: skill
scope: planning
runtime_scope: [claude]
version: 1.1.0
---

# Skill: `agent-assignment`

**Purpose.** Assign each task to a Codex agent and produce the agent map.

**Scope:** planning  ·  **Runtime:** claude

## Invocation triggers
- Phase 23

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
1. Map each task to exactly one assigned agent.
2. Define per-agent tools, model profile, and file ownership.
3. Validate against agent-map.schema.json.

## Checklist
- [ ] Completed: Map each task to exactly one assigned agent
- [ ] Completed: Define per-agent tools, model profile, and file ownership
- [ ] Completed: Validate against agent-map

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
- tests/fixtures/skills/agent-assignment.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'skill', 'path': '.claude/skills/agent-assignment/SKILL.md'}
- Codex: {'mechanism': 'n/a', 'path': None}
- Compatibility: Claude planning skill; primary planning belongs to Claude.
