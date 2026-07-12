---
name: security-threat-model-planning
kind: skill
scope: planning
runtime_scope: [claude]
version: 1.0.0
---

# Skill: `security-threat-model-planning`

**Purpose.** Build a threat model with misuse cases and concrete controls.

**Scope:** planning  ·  **Runtime:** claude

## Invocation triggers
- Phase 14

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
1. Enumerate threats and misuse cases.
2. Attach a control (SEC-###) to each threat.
3. Define security tests and incident telemetry mapped to acceptance criteria.

## Checklist
- [ ] Completed: Enumerate threats and misuse cases
- [ ] Completed: Attach a control (SEC-###) to each threat
- [ ] Completed: Define security tests and incident telemetry mapped to acceptance criteria

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
- tests/fixtures/skills/security-threat-model-planning.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'skill', 'path': '.claude/skills/security-threat-model-planning/SKILL.md'}
- Codex: {'mechanism': 'n/a', 'path': None}
- Compatibility: Claude planning skill; primary planning belongs to Claude.
