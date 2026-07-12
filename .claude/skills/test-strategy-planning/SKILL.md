---
name: test-strategy-planning
description: "Plan the full test pyramid and map every acceptance criterion to a test. Triggers: Phase 19."
---

# test-strategy-planning

Plan the full test pyramid and map every acceptance criterion to a test.

_Scope: planning · runtime adapter: Claude_

## Procedure
1. Define static analysis, unit, integration, contract, DB, auth, AI, E2E, a11y tests.
2. Map each AC-### to >=1 TEST-###.
3. Identify where manual QA is required.

## Checklist
- [ ] Completed: Define static analysis, unit, integration, contract, DB, auth, AI, E2E, a11y tests
- [ ] Completed: Map each AC-### to >=1 TEST-###
- [ ] Completed: Identify where manual QA is required

## When NOT to use
- during implementation

## Quality bar
output is specific, testable, and traceable; no vague language

## Do not
- write product code
- expose secrets
- start implementation

> Canonical definition: `system-building-os/skills/planning/test-strategy-planning.md`
