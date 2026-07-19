---
name: integration-implementation
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.1.0
---

# Skill: `integration-implementation`

**Purpose.** Implement external integrations with retries, mocks, and contract tests.

**Scope:** implementation  ·  **Runtime:** codex

## Invocation triggers
- integration tasks

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
1. Implement the adapter per the INT-### contract.
2. Add timeouts, retries, idempotency, and fallback.
3. Provide a mock/sandbox and contract tests.

## Checklist
- [ ] Completed: Implement the adapter per the INT-### contract
- [ ] Completed: Add timeouts, retries, idempotency, and fallback
- [ ] Completed: Provide a mock/sandbox and contract tests

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
- tests/fixtures/skills/integration-implementation.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/integration-implementation/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
