---
name: failure-diagnosis
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.1.0
---

# Skill: `failure-diagnosis`

**Purpose.** Classify a failure and collect minimal evidence.

**Scope:** implementation  ·  **Runtime:** codex

## Invocation triggers
- any failure

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
1. Classify the failure into a category.
2. Collect the minimal reproducing evidence.
3. Review previous attempts before proposing a fix.

## Checklist
- [ ] Completed: Classify the failure into a category
- [ ] Completed: Collect the minimal reproducing evidence
- [ ] Completed: Review previous attempts before proposing a fix

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
- tests/fixtures/skills/failure-diagnosis.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/failure-diagnosis/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
