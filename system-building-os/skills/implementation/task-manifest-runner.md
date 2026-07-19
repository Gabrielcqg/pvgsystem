---
name: task-manifest-runner
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.1.0
---

# Skill: `task-manifest-runner`

**Purpose.** Execute manifest tasks in dependency order with validations.

**Scope:** implementation  ·  **Runtime:** codex

## Invocation triggers
- main implementation loop

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
1. Select the next unblocked task from the DAG.
2. Load its context packet and enforce file ownership.
3. Run the task's validation commands; on failure escalate to failure-diagnosis.
4. Mark status and update the execution ledger.

## Checklist
- [ ] Completed: Select the next unblocked task from the DAG
- [ ] Completed: Load its context packet and enforce file ownership
- [ ] Completed: Run the task's validation commands
- [ ] Completed: Mark status and update the execution ledger

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
- tests/fixtures/skills/task-manifest-runner.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/task-manifest-runner/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
