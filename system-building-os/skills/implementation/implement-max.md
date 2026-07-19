---
name: implement-max
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.1.0
---

# Skill: `implement-max`

**Purpose.** Entry skill: implement the active plan until all completion gates pass.

**Scope:** implementation  ·  **Runtime:** codex

## Invocation triggers
- 'Implement the active system plan using the implement-max skill.'

## When not to use
- to reinterpret the product's core objective

## Expected inputs
- relevant plan artifacts
- task/context as applicable

## Required context
focused context packet or planning artifact set

## Outputs
- artifact(s) and/or validation results with traceable IDs

## Procedure
1. Locate and validate the active plan; read PLAN_METADATA and EXECUTION.lock.
2. Load the task manifest and execute tasks in dependency order.
3. Run validations after each task and phase; repair failures autonomously.
4. Preserve product scope; record deviations; continue until gates pass.
5. Invoke the final-acceptance-judge before declaring completion.

## Checklist
- [ ] Completed: Locate and validate the active plan
- [ ] Completed: Load the task manifest and execute tasks in dependency order
- [ ] Completed: Run validations after each task and phase
- [ ] Completed: Preserve product scope
- [ ] Completed: Invoke the final-acceptance-judge before declaring completion

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
- tests/fixtures/skills/implement-max.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/implement-max/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
