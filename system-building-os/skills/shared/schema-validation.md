---
name: schema-validation
kind: skill
scope: shared
runtime_scope: [claude, codex]
version: 1.0.0
---

# Skill: `schema-validation`

**Purpose.** Validate a JSON/YAML artifact against a canonical schema.

**Scope:** shared  ·  **Runtime:** claude, codex

## Invocation triggers
- whenever an artifact is produced

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
1. Select the schema by artifact type.
2. Validate with jsonschema_lite and report errors.
3. Fail the gate on any schema error.

## Checklist
- [ ] Completed: Select the schema by artifact type
- [ ] Completed: Validate with jsonschema_lite and report errors
- [ ] Completed: Fail the gate on any schema error

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
- tests/fixtures/skills/schema-validation.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'skill', 'path': '.claude/skills/schema-validation/SKILL.md'}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/schema-validation/SKILL.md'}
- Compatibility: Shared: one canonical definition projected into both runtimes.
