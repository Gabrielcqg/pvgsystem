# Vertical Traceability Evaluator

Owned by `cross-layer-reconciliation` (planning) and verified by the
`plan-consistency-judge`. Ensures product behavior is reconciled across every
applicable layer, not just requirement→task→test.

For each user-facing requirement, `vertical-traceability.yaml` must map:

```
goal → product requirement → business rule → AI/deterministic responsibility →
backend service → database entity or external integration → API contract →
frontend surface → frontend state → acceptance criterion → test → evidence
```

Rules:
- Validation **fails** when an applicable layer is missing for a requirement.
- UI requirements must have `frontend_surfaces` and `frontend_states`.
- AI requirements must have `ai_behaviors` referencing the responsibility matrix.
- Persisted requirements must have `database_entities`.
- Every requirement must have `acceptance_criteria` and `tests`.

Deterministic subset: `scripts/validate_plan_package.py` (vertical-traceability
closure). Artifact schema: `vertical-traceability.schema.json`. Skill:
`cross-layer-reconciliation`.
