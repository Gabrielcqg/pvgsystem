---
name: final-plan-comparison
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.1.0
---

# Skill: `final-plan-comparison`

**Purpose.** Compare the implementation to the plan before delivery.

**Scope:** implementation  ·  **Runtime:** codex

## Invocation triggers
- final acceptance

## When not to use
- to pass with unverified items

## Expected inputs
- relevant plan artifacts
- task/context as applicable

## Required context
focused context packet or planning artifact set

## Outputs
- artifact(s) and/or validation results with traceable IDs

## Procedure
1. Walk requirement->task->files and acceptance->test->evidence.
2. List any missing or failing items and reopen them.
3. Only pass when every required item is satisfied with evidence.

## Checklist
- [ ] Completed: Walk requirement->task->files and acceptance->test->evidence
- [ ] Completed: List any missing or failing items and reopen them
- [ ] Completed: Only pass when every required item is satisfied with evidence

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
- tests/fixtures/skills/final-plan-comparison.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/final-plan-comparison/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
