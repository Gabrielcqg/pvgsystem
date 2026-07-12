---
name: product-discovery
kind: skill
scope: planning
runtime_scope: [claude]
version: 1.0.0
---

# Skill: `product-discovery`

**Purpose.** Expand the idea into problem, users, value, and success definition.

**Scope:** planning  ·  **Runtime:** claude

## Invocation triggers
- Phase 1-2 of planning

## When not to use
- for pure technical decisions

## Expected inputs
- relevant plan artifacts
- task/context as applicable

## Required context
focused context packet or planning artifact set

## Outputs
- artifact(s) and/or validation results with traceable IDs

## Procedure
1. Restate the problem and who experiences it.
2. Identify how it is handled today and why a new system is needed.
3. Define the value and the concrete definition of success.
4. List explicit vs implicit requirements and non-negotiables.

## Checklist
- [ ] Completed: Restate the problem and who experiences it
- [ ] Completed: Identify how it is handled today and why a new system is needed
- [ ] Completed: Define the value and the concrete definition of success
- [ ] Completed: List explicit vs implicit requirements and non-negotiables

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
- tests/fixtures/skills/product-discovery.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'skill', 'path': '.claude/skills/product-discovery/SKILL.md'}
- Codex: {'mechanism': 'n/a', 'path': None}
- Compatibility: Claude planning skill; primary planning belongs to Claude.
