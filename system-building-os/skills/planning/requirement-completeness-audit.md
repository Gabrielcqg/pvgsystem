---
name: requirement-completeness-audit
kind: skill
scope: planning
runtime_scope: [claude]
version: 1.0.0
---

# Skill: `requirement-completeness-audit`

**Purpose.** Detect missing requirements across all system dimensions.

**Scope:** planning  ·  **Runtime:** claude

## Invocation triggers
- after first draft of the product plan

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
1. Check coverage of users, roles, tenancy, journeys, backend, frontend, data, auth, AI.
2. Check integrations, notifications, search, admin, observability, failure, rollback.
3. Flag every missing dimension as a gap for decision-resolution.
4. Confirm no dimension is silently skipped.

## Checklist
- [ ] Completed: Check coverage of users, roles, tenancy, journeys, backend, frontend, data, auth, AI
- [ ] Completed: Check integrations, notifications, search, admin, observability, failure, rollback
- [ ] Completed: Flag every missing dimension as a gap for decision-resolution
- [ ] Completed: Confirm no dimension is silently skipped

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
- tests/fixtures/skills/requirement-completeness-audit.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'skill', 'path': '.claude/skills/requirement-completeness-audit/SKILL.md'}
- Codex: {'mechanism': 'n/a', 'path': None}
- Compatibility: Claude planning skill; primary planning belongs to Claude.
