---
name: performance-budget-planning
kind: skill
scope: planning
runtime_scope: [claude]
version: 1.1.0
---

# Skill: `performance-budget-planning`

**Purpose.** Set measurable performance budgets and a regression strategy.

**Scope:** planning  ·  **Runtime:** claude

## Invocation triggers
- Phase 18 & 21

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
1. Set numeric budgets for load, latency, jobs, AI, bundle, memory.
2. Define profiling, load testing, and regression detection.
3. Define cost/context budgets via capability classes.

## Checklist
- [ ] Completed: Set numeric budgets for load, latency, jobs, AI, bundle, memory
- [ ] Completed: Define profiling, load testing, and regression detection
- [ ] Completed: Define cost/context budgets via capability classes

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
- tests/fixtures/skills/performance-budget-planning.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'skill', 'path': '.claude/skills/performance-budget-planning/SKILL.md'}
- Codex: {'mechanism': 'n/a', 'path': None}
- Compatibility: Claude planning skill; primary planning belongs to Claude.
