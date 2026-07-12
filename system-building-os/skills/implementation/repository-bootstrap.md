---
name: repository-bootstrap
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.0.0
---

# Skill: `repository-bootstrap`

**Purpose.** Bootstrap the project skeleton and detect toolchain commands.

**Scope:** implementation  ·  **Runtime:** codex

## Invocation triggers
- BOOTSTRAPPING state

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
1. Detect package manager, lint, test, build, and migration commands.
2. Record detected commands in the active plan.
3. Create the minimal runnable skeleton per the architecture.

## Checklist
- [ ] Completed: Detect package manager, lint, test, build, and migration commands
- [ ] Completed: Record detected commands in the active plan
- [ ] Completed: Create the minimal runnable skeleton per the architecture

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
- tests/fixtures/skills/repository-bootstrap.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/repository-bootstrap/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
