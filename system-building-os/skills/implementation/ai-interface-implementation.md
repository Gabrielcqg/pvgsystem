---
name: ai-interface-implementation
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.1.0
---

# Skill: `ai-interface-implementation`

**Purpose.** Implement the production AI path behind a provider-independent interface with a real adapter.

**Scope:** implementation  ·  **Runtime:** codex

## Invocation triggers
- AI tasks when the product depends on an external provider

## When not to use
- to ship a scripted/fake production AI path
- to expose secrets

## Expected inputs
- relevant plan artifacts
- task/context as applicable

## Required context
focused context packet or planning artifact set

## Outputs
- artifact(s) and/or validation results with traceable IDs

## Procedure
1. Implement the provider-independent interface and a concrete provider adapter.
2. Wire timeout, retry, rate-limit handling, structured output, and prompt versioning.
3. Add startup validation for missing configuration and reference secrets by env-var name only.
4. Add fakes/mocks for tests and an optional real-key integration test; mock is never the production default.

## Checklist
- [ ] Completed: Implement the provider-independent interface and a concrete provider adapter
- [ ] Completed: Wire timeout, retry, rate-limit handling, structured output, and prompt versioning
- [ ] Completed: Add startup validation for missing configuration and reference secrets by env-var name only
- [ ] Completed: Add fakes/mocks for tests and an optional real-key integration test

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
- tests/fixtures/skills/ai-interface-implementation.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/ai-interface-implementation/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
