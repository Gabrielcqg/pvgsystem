---
name: visual-regression
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.1.0
---

# Skill: `visual-regression`

**Purpose.** Capture and compare visual evidence for major screens; flag regressions.

**Scope:** implementation  ·  **Runtime:** codex

## Invocation triggers
- frontend review
- browser validation

## When not to use
- during product discovery

## Expected inputs
- relevant plan artifacts
- task/context as applicable

## Required context
focused context packet or planning artifact set

## Outputs
- artifact(s) and/or validation results with traceable IDs

## Procedure
1. Capture screenshots for major screens across breakpoints.
2. Compare against baselines or perform structured visual review when baselines are absent.
3. Attach evidence to visual acceptance criteria.

## Checklist
- [ ] Completed: Capture screenshots for major screens across breakpoints
- [ ] Completed: Compare against baselines or perform structured visual review when baselines are absent
- [ ] Completed: Attach evidence to visual acceptance criteria

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
- tests/fixtures/skills/visual-regression.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/visual-regression/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
