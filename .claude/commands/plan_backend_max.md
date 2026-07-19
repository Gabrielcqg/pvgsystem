---
description: Deepen backend, business logic, API, and asynchronous processing for the active plan. Refinement only — /plan_max already includes this behavior.
argument-hint: [focus area | "audit"]
---

# /plan_backend_max

Specialist refinement of the **backend** dimension of the active plan. Optional:
`/plan_max` already produces the backend/domain and API contract plans.

## User input
$ARGUMENTS

## How to run
Load the active plan. Use the `backend-api-architect` subagent and invoke
`backend-api-planning` (and `business-rule-specification` as needed) to deepen:
- domain modules, service boundaries, and the error model;
- every endpoint (API-###) with request/response schemas, validation, and codes;
- idempotency, side effects, events, jobs, queues, concurrency, caching, retries;
- observability hooks and test boundaries.

## Rules
- Do not write product code.
- Every user-visible backend capability maps to a frontend surface (via an
  interaction contract) unless explicitly administrative, background-only, or API-only.
- After material changes, run `/plan_reconcile` and re-validate.

## Finish by
Reporting changed contracts and running
`python3 scripts/validate_plan_package.py plans/active/<slug>`.
