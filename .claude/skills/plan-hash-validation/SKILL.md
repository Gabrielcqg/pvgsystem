---
name: plan-hash-validation
description: "Verify the active plan version and content hash match EXECUTION.lock. Triggers: start of implementation; on plan change."
---

# plan-hash-validation

Verify the active plan version and content hash match EXECUTION.lock.

_Scope: shared · runtime adapter: Claude_

## Procedure
1. Compute the plan package hash.
2. Compare against PLAN_METADATA and EXECUTION.lock.
3. Block implementation on mismatch or conflicting versions.

## Checklist
- [ ] Completed: Compute the plan package hash
- [ ] Completed: Compare against PLAN_METADATA and EXECUTION
- [ ] Completed: Block implementation on mismatch or conflicting versions

## When NOT to use
- during product discovery

## Quality bar
output is specific, testable, and traceable; no vague language

## Do not
- expose secrets
- reinterpret product scope

> Canonical definition: `system-building-os/skills/shared/plan-hash-validation.md`
