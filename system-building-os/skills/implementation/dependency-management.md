---
name: dependency-management
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.0.0
---

# Skill: `dependency-management`

**Purpose.** Install and pin normal project dependencies safely.

**Scope:** implementation  ·  **Runtime:** codex

## Invocation triggers
- bootstrap and as needed

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
1. Install required dependencies with the detected package manager.
2. Pin versions and record them.
3. Never install from untrusted sources; run a dependency security check.

## Checklist
- [ ] Completed: Install required dependencies with the detected package manager
- [ ] Completed: Pin versions and record them
- [ ] Completed: Never install from untrusted sources

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
- tests/fixtures/skills/dependency-management.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/dependency-management/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
