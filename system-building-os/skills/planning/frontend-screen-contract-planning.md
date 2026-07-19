---
name: frontend-screen-contract-planning
kind: skill
scope: planning
runtime_scope: [claude]
version: 1.1.0
---

# Skill: `frontend-screen-contract-planning`

**Purpose.** Produce detailed per-surface screen contracts with every state and data/backend/AI dependency.

**Scope:** planning  ·  **Runtime:** claude

## Invocation triggers
- Phase 12 (deep frontend plan)

## When not to use
- to emit a list of page names
- to allow fake/static data in a production path

## Expected inputs
- relevant plan artifacts
- task/context as applicable

## Required context
focused context packet or planning artifact set

## Outputs
- artifact(s) and/or validation results with traceable IDs

## Procedure
1. For each page/route/modal/panel/component emit a UI-### screen contract.
2. Define all applicable states (default/loading/streaming/generating/reconnecting/empty/partial_data/error/success/disabled/permission_denied).
3. Bind each surface to its requirement, API/action, state-machine state, and tests.
4. Add component and frontend-state inventories.
5. Validate against screen-contract/component-contract/frontend-state schemas.

## Checklist
- [ ] Completed: For each page/route/modal/panel/component emit a UI-### screen contract
- [ ] Completed: Define all applicable states (default/loading/streaming/generating/reconnecting/empty/partial_data/error/success/disabled/permission_denied)
- [ ] Completed: Bind each surface to its requirement, API/action, state-machine state, and tests
- [ ] Completed: Add component and frontend-state inventories
- [ ] Completed: Validate against screen-contract/component-contract/frontend-state schemas

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
- tests/fixtures/skills/frontend-screen-contract-planning.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'skill', 'path': '.claude/skills/frontend-screen-contract-planning/SKILL.md'}
- Codex: {'mechanism': 'n/a', 'path': None}
- Compatibility: Claude planning skill; primary planning belongs to Claude.
