---
description: Deepen, redesign, or audit the frontend & UI/UX plan of the active plan. Refinement only — /plan_max already includes this behavior.
argument-hint: [focus area | "audit" | "redesign <screen>"]
---

# /plan_frontend_max

Specialist refinement of the **frontend** dimension of the active plan. This is
**optional**: `/plan_max` already runs the frontend reference intake, frontend
experience grill, screen/component/interaction contracts, and reconciliation.
Use this to go deeper, redesign, or re-audit after a change.

## User input
$ARGUMENTS

## How to run
Load the active plan under `plans/active/<slug>/`. Use the
`frontend-uiux-architect` subagent and invoke, in order:
1. `frontend-reference-intake` — re-read `project-reference/frontend/`; never overwrite user references; record provenance.
2. `frontend-experience-grill` — challenge product communication, information architecture, creativity/differentiation, usability, responsiveness, visual quality → concrete decisions + a `visual-quality-review`.
3. `frontend-screen-contract-planning` — per-surface screen contracts (UI-###) with **every** state (default/loading/streaming/generating/reconnecting/empty/partial/error/success/disabled/permission_denied), component contracts (CMP-###), frontend-state inventory (STATE-###), and design tokens.
4. `frontend-backend-contract-planning` — an interaction contract (IX-###) per user action; reject dead buttons and fake/static data in production paths.

## Rules
- Do not write product code.
- Every surface maps to a requirement, an API/action, a state, and tests.
- After material changes, run `/plan_reconcile` (or `cross-layer-reconciliation`) and re-validate.

## Finish by
Reporting which screens/contracts changed and running
`python3 scripts/validate_plan_package.py plans/active/<slug>`.
