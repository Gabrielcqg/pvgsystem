---
description: Run all plan completeness and traceability checks.
argument-hint: <optional: plan slug>
---

# /plan_validate

Run all plan completeness and traceability checks.

## Input
$ARGUMENTS

## Steps
1. Run `python3 scripts/validate_plan_package.py plans/active/<slug>`.
2. Run `plan-consistency-validation` and `requirement-traceability`.
3. Validate every machine-readable artifact against `system-building-os/schemas/`.
4. Output a validation score and the list of critical findings.
5. Only a passing result may set `plan_status: implementation_ready`.

> Part of the Autonomous System Building OS. Planning runtime = Claude. Never write product code.
