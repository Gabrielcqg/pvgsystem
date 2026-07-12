---
name: active-plan-reader
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.0.0
---

# Skill: `active-plan-reader`

**Purpose.** Locate, load, and validate the active plan package and its version/hash.

**Scope:** implementation  ·  **Runtime:** codex

## Invocation triggers
- start of implementation

## When not to use
- to edit the plan

## Expected inputs
- relevant plan artifacts
- task/context as applicable

## Required context
focused context packet or planning artifact set

## Outputs
- artifact(s) and/or validation results with traceable IDs

## Procedure
1. Find plans/active/<slug>/ and read PLAN_METADATA.yaml.
2. Verify the plan hash and EXECUTION.lock status.
3. Load task manifest, agent map, skill map, and acceptance criteria.
4. Fail fast if the package is incomplete or conflicting.

## Checklist
- [ ] Completed: Find plans/active/<slug>/ and read PLAN_METADATA
- [ ] Completed: Verify the plan hash and EXECUTION
- [ ] Completed: Load task manifest, agent map, skill map, and acceptance criteria
- [ ] Completed: Fail fast if the package is incomplete or conflicting

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
- tests/fixtures/skills/active-plan-reader.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/active-plan-reader/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
