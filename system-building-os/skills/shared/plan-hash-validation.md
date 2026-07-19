---
name: plan-hash-validation
kind: skill
scope: shared
runtime_scope: [claude, codex]
version: 1.1.0
---

# Skill: `plan-hash-validation`

**Purpose.** Verify the active plan version and content hash match EXECUTION.lock.

**Scope:** shared  ·  **Runtime:** claude, codex

## Invocation triggers
- start of implementation
- on plan change

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
1. Compute the plan package hash.
2. Compare against PLAN_METADATA and EXECUTION.lock.
3. Block implementation on mismatch or conflicting versions.

## Checklist
- [ ] Completed: Compute the plan package hash
- [ ] Completed: Compare against PLAN_METADATA and EXECUTION
- [ ] Completed: Block implementation on mismatch or conflicting versions

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
- tests/fixtures/skills/plan-hash-validation.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'skill', 'path': '.claude/skills/plan-hash-validation/SKILL.md'}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/plan-hash-validation/SKILL.md'}
- Compatibility: Shared: one canonical definition projected into both runtimes.
