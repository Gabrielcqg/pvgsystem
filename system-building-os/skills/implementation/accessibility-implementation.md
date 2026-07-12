---
name: accessibility-implementation
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.0.0
---

# Skill: `accessibility-implementation`

**Purpose.** Implement accessibility to the target conformance level.

**Scope:** implementation  ·  **Runtime:** codex

## Invocation triggers
- frontend tasks
- browser validation

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
1. Add semantic roles, labels, and focus management.
2. Verify contrast and keyboard operability.
3. Run an automated a11y check and record results.

## Checklist
- [ ] Completed: Add semantic roles, labels, and focus management
- [ ] Completed: Verify contrast and keyboard operability
- [ ] Completed: Run an automated a11y check and record results

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
- tests/fixtures/skills/accessibility-implementation.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/accessibility-implementation/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
