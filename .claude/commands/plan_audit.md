---
description: Inspect an existing plan for omissions and implementation ambiguity.
argument-hint: <optional: plan slug>
---

# /plan_audit

Inspect an existing plan for omissions and implementation ambiguity.

## Input
$ARGUMENTS

## Steps
1. Locate the plan package (active by default, or the given slug).
2. Run `requirement-completeness-audit` and `plan-consistency-validation`.
3. Report omissions, vague requirements, missing tests, and traceability breaks.
4. Do NOT mark the plan ready; produce findings only.

> Part of the Autonomous System Building OS. Planning runtime = Claude. Never write product code.
