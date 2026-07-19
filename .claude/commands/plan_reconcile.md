---
description: Re-run cross-layer traceability after a material plan revision, rebuilding vertical-traceability.yaml and re-auditing.
argument-hint: [reason for reconciliation]
---

# /plan_reconcile

Re-run **cross-layer reconciliation** after a material change to the active plan
(e.g. after `/plan_frontend_max`, `/plan_backend_max`, `/plan_ai_max`, or
`/plan_data_max`). Optional during a normal `/plan_max`, which already reconciles.

## User input
$ARGUMENTS

## How to run
Load the active plan under `plans/active/<slug>/`. Use the `planning-orchestrator`
subagent and invoke `cross-layer-reconciliation`:
1. For each user-facing requirement, rebuild the map goal→business rule→AI/deterministic responsibility→backend service→database entity/integration→API contract→frontend surface→frontend state→acceptance criterion→test→evidence.
2. Detect any missing **applicable** layer and reopen it.
3. Confirm AI requirements have AI behaviors and UI requirements have surfaces + states.
4. Rewrite `vertical-traceability.yaml` (validates against `vertical-traceability.schema.json`).
5. Re-run the embedded independent audit (`plan-consistency-validation`) and repair critical/major findings before re-marking `IMPLEMENTATION_READY`.

## Rules
- Do not write product code.
- Reconciliation fails when a layer that applies to the product is missing for any requirement.

## Finish by
Reporting new/broken cross-layer links and running
`python3 scripts/validate_plan_package.py plans/active/<slug>`.
