---
name: frontend-screen-contract-planning
description: "Produce detailed per-surface screen contracts with every state and data/backend/AI dependency. Triggers: Phase 12 (deep frontend plan)."
---

# frontend-screen-contract-planning

Produce detailed per-surface screen contracts with every state and data/backend/AI dependency.

_Scope: planning · runtime adapter: Claude_

## Procedure
1. For each page/route/modal/panel/component emit a UI-### screen contract.
2. Define all applicable states (default/loading/streaming/generating/reconnecting/empty/partial_data/error/success/disabled/permission_denied).
3. Bind each surface to its requirement, API/action, state-machine state, and tests.
4. Add component and frontend-state inventories.
5. Validate against screen-contract/component-contract/frontend-state schemas.

## Checklist
- [ ] Completed: For each page/route/modal/panel/component emit a UI-### screen contract
- [ ] Completed: Define all applicable states (default/loading/streaming/generating/reconnecting/empty/partial_data/error/success/disabled/permission_denied)
- [ ] Completed: Bind each surface to its requirement, API/action, state-machine state, and tests
- [ ] Completed: Add component and frontend-state inventories
- [ ] Completed: Validate against screen-contract/component-contract/frontend-state schemas

## When NOT to use
- to emit a list of page names
- to allow fake/static data in a production path

## Quality bar
output is specific, testable, and traceable; no vague language

## Do not
- write product code
- expose secrets
- start implementation

> Canonical definition: `system-building-os/skills/planning/frontend-screen-contract-planning.md`
