---
name: secret-scanning
kind: skill
scope: shared
runtime_scope: [claude, codex]
version: 1.1.0
---

# Skill: `secret-scanning`

**Purpose.** Scan for secret exposure in files, diffs, and command output.

**Scope:** shared  ·  **Runtime:** claude, codex

## Invocation triggers
- before any file read/write/commit
- CI

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
1. Match protected-path patterns and known secret signatures.
2. Block reads/writes/commits that would expose secrets.
3. Report only metadata (never the secret value).

## Checklist
- [ ] Completed: Match protected-path patterns and known secret signatures
- [ ] Completed: Block reads/writes/commits that would expose secrets
- [ ] Completed: Report only metadata (never the secret value)

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
- tests/fixtures/skills/secret-scanning.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'skill', 'path': '.claude/skills/secret-scanning/SKILL.md'}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/secret-scanning/SKILL.md'}
- Compatibility: Shared: one canonical definition projected into both runtimes.
