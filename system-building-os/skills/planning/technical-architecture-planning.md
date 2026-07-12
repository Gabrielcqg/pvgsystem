---
name: technical-architecture-planning
kind: skill
scope: planning
runtime_scope: [claude]
version: 1.0.0
---

# Skill: `technical-architecture-planning`

**Purpose.** Produce the technical architecture with diagrams and ADRs.

**Scope:** planning  ·  **Runtime:** claude

## Invocation triggers
- Phase 9

## When not to use
- to specify product requirements

## Expected inputs
- relevant plan artifacts
- task/context as applicable

## Required context
focused context packet or planning artifact set

## Outputs
- artifact(s) and/or validation results with traceable IDs

## Procedure
1. Define components, boundaries, dependency rules, and flows.
2. Diagram key request/event flows in Mermaid.
3. Record technology choices, alternatives, trade-offs, and ADR-### entries.

## Checklist
- [ ] Completed: Define components, boundaries, dependency rules, and flows
- [ ] Completed: Diagram key request/event flows in Mermaid
- [ ] Completed: Record technology choices, alternatives, trade-offs, and ADR-### entries

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
- tests/fixtures/skills/technical-architecture-planning.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'skill', 'path': '.claude/skills/technical-architecture-planning/SKILL.md'}
- Codex: {'mechanism': 'n/a', 'path': None}
- Compatibility: Claude planning skill; primary planning belongs to Claude.
