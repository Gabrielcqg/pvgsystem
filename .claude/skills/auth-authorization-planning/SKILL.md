---
name: auth-authorization-planning
description: "Design identity, sessions, and the authorization model. Triggers: Phase 14."
---

# auth-authorization-planning

Design identity, sessions, and the authorization model.

_Scope: planning · runtime adapter: Claude_

## Procedure
1. Decide auth methods and account lifecycle.
2. Define session/token strategy, recovery, verification.
3. Enumerate roles (AUTH-###), permissions, boundaries, privileged actions, audit.

## Checklist
- [ ] Completed: Decide auth methods and account lifecycle
- [ ] Completed: Define session/token strategy, recovery, verification
- [ ] Completed: Enumerate roles (AUTH-###), permissions, boundaries, privileged actions, audit

## When NOT to use
- during implementation

## Quality bar
output is specific, testable, and traceable; no vague language

## Do not
- write product code
- expose secrets
- start implementation

> Canonical definition: `system-building-os/skills/planning/auth-authorization-planning.md`
