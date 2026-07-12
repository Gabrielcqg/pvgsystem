---
name: security-review
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.0.0
---

# Skill: `security-review`

**Purpose.** Review for injection, secrets, permissions, and unsafe config (read-only preferred).

**Scope:** implementation  ·  **Runtime:** codex

## Invocation triggers
- REVIEWING state

## When not to use
- to weaken protections for convenience

## Expected inputs
- relevant plan artifacts
- task/context as applicable

## Required context
focused context packet or planning artifact set

## Outputs
- artifact(s) and/or validation results with traceable IDs

## Procedure
1. Scan for secret exposure and insecure configuration.
2. Check auth boundaries, injection, and permissions.
3. Run a dependency security check; record findings.

## Checklist
- [ ] Completed: Scan for secret exposure and insecure configuration
- [ ] Completed: Check auth boundaries, injection, and permissions
- [ ] Completed: Run a dependency security check

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
- tests/fixtures/skills/security-review.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/security-review/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
