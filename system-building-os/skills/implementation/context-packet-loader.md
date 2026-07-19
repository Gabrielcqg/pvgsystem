---
name: context-packet-loader
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.1.0
---

# Skill: `context-packet-loader`

**Purpose.** Load only the focused context a task needs.

**Scope:** implementation  ·  **Runtime:** codex

## Invocation triggers
- before executing a task

## When not to use
- to load the entire planning corpus

## Expected inputs
- relevant plan artifacts
- task/context as applicable

## Required context
focused context packet or planning artifact set

## Outputs
- artifact(s) and/or validation results with traceable IDs

## Procedure
1. Read the task's context packet.
2. Load referenced requirements, files, tests, and skills only.
3. Reject work that requires context outside the packet without escalation.

## Checklist
- [ ] Completed: Read the task's context packet
- [ ] Completed: Load referenced requirements, files, tests, and skills only
- [ ] Completed: Reject work that requires context outside the packet without escalation

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
- tests/fixtures/skills/context-packet-loader.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/context-packet-loader/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
