---
name: final-delivery-report
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.1.0
---

# Skill: `final-delivery-report`

**Purpose.** Produce the truthful, evidence-based final report.

**Scope:** implementation  ·  **Runtime:** codex

## Invocation triggers
- READY_FOR_DELIVERY

## When not to use
- to claim untested success

## Expected inputs
- relevant plan artifacts
- task/context as applicable

## Required context
focused context packet or planning artifact set

## Outputs
- artifact(s) and/or validation results with traceable IDs

## Procedure
1. Report every completion gate PASS/FAIL/NA with evidence.
2. List deviations, external blockers, and honest failures.
3. Validate against final-report.schema.json.

## Checklist
- [ ] Completed: Report every completion gate PASS/FAIL/NA with evidence
- [ ] Completed: List deviations, external blockers, and honest failures
- [ ] Completed: Validate against final-report

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
- tests/fixtures/skills/final-delivery-report.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/final-delivery-report/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
