---
name: business-rule-specification
kind: skill
scope: planning
runtime_scope: [claude]
version: 1.0.0
---

# Skill: `business-rule-specification`

**Purpose.** Specify exact business rules with conditions, precedence, and examples.

**Scope:** planning  ·  **Runtime:** claude

## Invocation triggers
- Phase 8.8

## When not to use
- during implementation

## Expected inputs
- relevant plan artifacts
- task/context as applicable

## Required context
focused context packet or planning artifact set

## Outputs
- artifact(s) and/or validation results with traceable IDs

## Procedure
1. Assign RULE-### and state trigger, inputs, exact condition, output.
2. Define precedence, exceptions, failure behavior, audit requirement.
3. Provide worked examples and tests.

## Checklist
- [ ] Completed: Assign RULE-### and state trigger, inputs, exact condition, output
- [ ] Completed: Define precedence, exceptions, failure behavior, audit requirement
- [ ] Completed: Provide worked examples and tests

## Quality bar
output is specific, testable, and traceable; no vague language

## Failure conditions
- missing required fields
- vague/untestable output
- secret exposure
- scope violation

## Allowed tools
- read
- write_planning_artifacts
- search

## Disallowed actions
- write product code
- expose secrets
- start implementation

## Tool access
planning (read + write artifacts)

## Test fixtures
- tests/fixtures/skills/business-rule-specification.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'skill', 'path': '.claude/skills/business-rule-specification/SKILL.md'}
- Codex: {'mechanism': 'n/a', 'path': None}
- Compatibility: Claude planning skill; primary planning belongs to Claude.
