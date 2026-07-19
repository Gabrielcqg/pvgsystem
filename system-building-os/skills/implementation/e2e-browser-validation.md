---
name: e2e-browser-validation
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.1.0
---

# Skill: `e2e-browser-validation`

**Purpose.** Run real end-to-end flows in a browser and capture evidence.

**Scope:** implementation  ·  **Runtime:** codex

## Invocation triggers
- UI present

## When not to use
- editing code unless configured as combined role

## Expected inputs
- relevant plan artifacts
- task/context as applicable

## Required context
focused context packet or planning artifact set

## Outputs
- artifact(s) and/or validation results with traceable IDs

## Procedure
1. Launch the app and navigate each critical flow.
2. Check console errors, network failures, responsiveness, a11y.
3. Capture screenshots/logs as evidence for acceptance criteria.

## Checklist
- [ ] Completed: Launch the app and navigate each critical flow
- [ ] Completed: Check console errors, network failures, responsiveness, a11y
- [ ] Completed: Capture screenshots/logs as evidence for acceptance criteria

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
- tests/fixtures/skills/e2e-browser-validation.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/e2e-browser-validation/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
