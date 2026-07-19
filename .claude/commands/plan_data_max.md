---
description: Deepen database, migrations, storage, retention, and analytics for the active plan. Refinement only — /plan_max already includes this behavior.
argument-hint: [focus area | "audit"]
---

# /plan_data_max

Specialist refinement of the **data** dimension of the active plan. Optional:
`/plan_max` already produces the data architecture and migration plans.

## User input
$ARGUMENTS

## How to run
Load the active plan. Use the `data-architect` subagent and invoke
`data-architecture-planning`, `database-selection`, and `migration-planning` to deepen:
- entities (DB-###), fields, types, relationships, constraints, indexes mapped to queries;
- ownership, classification, personal data, retention, backup/restore;
- migration ordering, per-migration rollback, expand-and-contract, schema-drift checks;
- seeds/fixtures (synthetic only), storage/vector/cache, analytics/reporting.

## Rules
- Do not write product code.
- Every persisted entity appears in `vertical-traceability.yaml` for the requirements it serves.
- After material changes, run `/plan_reconcile` and re-validate.

## Finish by
Reporting changed entities/migrations and running
`python3 scripts/validate_plan_package.py plans/active/<slug>`.
