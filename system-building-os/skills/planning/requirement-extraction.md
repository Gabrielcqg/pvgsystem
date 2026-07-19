---
name: requirement-extraction
kind: skill
scope: planning
runtime_scope: [claude]
version: 1.1.0
---

# Skill: `requirement-extraction`

**Purpose.** Turn intent into testable requirements with IDs.

**Scope:** planning  ·  **Runtime:** claude

## Invocation triggers
- Phase 8 product plan

## When not to use
- for vague wishlists without acceptance criteria

## Expected inputs
- relevant plan artifacts
- task/context as applicable

## Required context
focused context packet or planning artifact set

## Outputs
- artifact(s) and/or validation results with traceable IDs

## Procedure
1. Enumerate functional requirements with FR-### ids and all required fields.
2. Enumerate non-functional requirements with NFR-### ids and measurable targets.
3. Attach actors, preconditions, validation, errors, permissions, dependencies.
4. Ensure each requirement is testable and unambiguous.

## Checklist
- [ ] Completed: Enumerate functional requirements with FR-### ids and all required fields
- [ ] Completed: Enumerate non-functional requirements with NFR-### ids and measurable targets
- [ ] Completed: Attach actors, preconditions, validation, errors, permissions, dependencies
- [ ] Completed: Ensure each requirement is testable and unambiguous

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
- tests/fixtures/skills/requirement-extraction.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'skill', 'path': '.claude/skills/requirement-extraction/SKILL.md'}
- Codex: {'mechanism': 'n/a', 'path': None}
- Compatibility: Claude planning skill; primary planning belongs to Claude.
