---
name: checkpoint-and-rollback
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.1.0
---

# Skill: `checkpoint-and-rollback`

**Purpose.** Create checkpoints and revert only problematic changes.

**Scope:** implementation  ·  **Runtime:** codex

## Invocation triggers
- before risky changes
- on repeated failure

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
1. Checkpoint before risky changes.
2. On failure revert only the failed approach, preserving good work.
3. Record the checkpoint and rollback in the ledger.

## Checklist
- [ ] Completed: Checkpoint before risky changes
- [ ] Completed: On failure revert only the failed approach, preserving good work
- [ ] Completed: Record the checkpoint and rollback in the ledger

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
- tests/fixtures/skills/checkpoint-and-rollback.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/checkpoint-and-rollback/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
