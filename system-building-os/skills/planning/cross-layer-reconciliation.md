---
name: cross-layer-reconciliation
kind: skill
scope: planning
runtime_scope: [claude]
version: 1.1.0
---

# Skill: `cross-layer-reconciliation`

**Purpose.** Reconcile product behavior across every applicable layer into vertical traceability.

**Scope:** planning  ·  **Runtime:** claude

## Invocation triggers
- Phase after all domain plans
- /plan_reconcile
- after any material plan revision

## When not to use
- to skip a layer that applies to the product

## Expected inputs
- relevant plan artifacts
- task/context as applicable

## Required context
focused context packet or planning artifact set

## Outputs
- artifact(s) and/or validation results with traceable IDs

## Procedure
1. For each user-facing requirement map goal->rule->AI/deterministic->backend->data/integration->API->frontend surface->frontend state->acceptance->test->evidence.
2. Detect any missing applicable layer and reopen it.
3. Confirm AI requirements have AI behaviors and UI requirements have surfaces + states.
4. Emit vertical-traceability.yaml validating against vertical-traceability.schema.json.

## Checklist
- [ ] Completed: For each user-facing requirement map goal->rule->AI/deterministic->backend->data/integration->API->frontend surface->frontend state->acceptance->test->evidence
- [ ] Completed: Detect any missing applicable layer and reopen it
- [ ] Completed: Confirm AI requirements have AI behaviors and UI requirements have surfaces + states
- [ ] Completed: Emit vertical-traceability

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
- tests/fixtures/skills/cross-layer-reconciliation.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'skill', 'path': '.claude/skills/cross-layer-reconciliation/SKILL.md'}
- Codex: {'mechanism': 'n/a', 'path': None}
- Compatibility: Claude planning skill; primary planning belongs to Claude.
