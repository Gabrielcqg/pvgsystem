---
name: requirement-completeness-audit
description: "Detect missing requirements across all system dimensions. Triggers: after first draft of the product plan."
---

# requirement-completeness-audit

Detect missing requirements across all system dimensions.

_Scope: planning · runtime adapter: Claude_

## Procedure
1. Check coverage of users, roles, tenancy, journeys, backend, frontend, data, auth, AI.
2. Check integrations, notifications, search, admin, observability, failure, rollback.
3. Flag every missing dimension as a gap for decision-resolution.
4. Confirm no dimension is silently skipped.

## Checklist
- [ ] Completed: Check coverage of users, roles, tenancy, journeys, backend, frontend, data, auth, AI
- [ ] Completed: Check integrations, notifications, search, admin, observability, failure, rollback
- [ ] Completed: Flag every missing dimension as a gap for decision-resolution
- [ ] Completed: Confirm no dimension is silently skipped

## When NOT to use
- during implementation

## Quality bar
output is specific, testable, and traceable; no vague language

## Do not
- write product code
- expose secrets
- start implementation

> Canonical definition: `system-building-os/skills/planning/requirement-completeness-audit.md`
