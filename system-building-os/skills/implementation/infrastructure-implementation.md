---
name: infrastructure-implementation
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.1.0
---

# Skill: `infrastructure-implementation`

**Purpose.** Implement containers, IaC, and CI/CD.

**Scope:** implementation  ·  **Runtime:** codex

## Invocation triggers
- infrastructure tasks

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
1. Write container + IaC definitions per the infra plan.
2. Wire CI/CD stages and deploy configuration.
3. Never embed secret values; use env-var references.

## Checklist
- [ ] Completed: Write container + IaC definitions per the infra plan
- [ ] Completed: Wire CI/CD stages and deploy configuration
- [ ] Completed: Never embed secret values

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
- tests/fixtures/skills/infrastructure-implementation.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/infrastructure-implementation/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
