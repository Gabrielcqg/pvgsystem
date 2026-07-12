---
name: failure-recovery
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.0.0
---

# Skill: `failure-recovery`

**Purpose.** Apply a bounded, strategy-changing repair without infinite loops.

**Scope:** implementation  ·  **Runtime:** codex

## Invocation triggers
- REPAIRING state

## When not to use
- identical retries

## Expected inputs
- relevant plan artifacts
- task/context as applicable

## Required context
focused context packet or planning artifact set

## Outputs
- artifact(s) and/or validation results with traceable IDs

## Procedure
1. Choose a repair strategy different from prior identical attempts.
2. Checkpoint, apply a bounded correction, run targeted + regression validation.
3. After the attempt budget, escalate or mark externally blocked with a reason.

## Checklist
- [ ] Completed: Choose a repair strategy different from prior identical attempts
- [ ] Completed: Checkpoint, apply a bounded correction, run targeted + regression validation
- [ ] Completed: After the attempt budget, escalate or mark externally blocked with a reason

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
- tests/fixtures/skills/failure-recovery.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/failure-recovery/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
