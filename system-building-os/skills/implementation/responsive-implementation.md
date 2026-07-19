---
name: responsive-implementation
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.1.0
---

# Skill: `responsive-implementation`

**Purpose.** Implement responsive behavior across breakpoints.

**Scope:** implementation  ·  **Runtime:** codex

## Invocation triggers
- frontend tasks

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
1. Implement per-breakpoint layouts.
2. Verify reflow, touch, and keyboard behavior.
3. Add responsive checks to browser validation.

## Checklist
- [ ] Completed: Implement per-breakpoint layouts
- [ ] Completed: Verify reflow, touch, and keyboard behavior
- [ ] Completed: Add responsive checks to browser validation

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
- tests/fixtures/skills/responsive-implementation.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/responsive-implementation/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
