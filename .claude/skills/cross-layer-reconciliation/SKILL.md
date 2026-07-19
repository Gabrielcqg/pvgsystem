---
name: cross-layer-reconciliation
description: "Reconcile product behavior across every applicable layer into vertical traceability. Triggers: Phase after all domain plans; /plan_reconcile; after any material plan revision."
---

# cross-layer-reconciliation

Reconcile product behavior across every applicable layer into vertical traceability.

_Scope: planning · runtime adapter: Claude_

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

## When NOT to use
- to skip a layer that applies to the product

## Quality bar
output is specific, testable, and traceable; no vague language

## Do not
- write product code
- expose secrets
- start implementation

> Canonical definition: `system-building-os/skills/planning/cross-layer-reconciliation.md`
