---
name: phase-completion-reporting
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.1.0
---

# Skill: `phase-completion-reporting`

**Purpose.** Report phase completion and update state.

**Scope:** implementation  ·  **Runtime:** codex

## Invocation triggers
- end of each phase

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
1. Summarize what completed and validation status.
2. Write a phase log and update runtime state.
3. Confirm gates relevant to the phase are green.

## Checklist
- [ ] Completed: Summarize what completed and validation status
- [ ] Completed: Write a phase log and update runtime state
- [ ] Completed: Confirm gates relevant to the phase are green

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
- tests/fixtures/skills/phase-completion-reporting.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/phase-completion-reporting/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
