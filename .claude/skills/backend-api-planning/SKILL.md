---
name: backend-api-planning
description: "Design domain services and API contracts. Triggers: Phase 11 & 13."
---

# backend-api-planning

Design domain services and API contracts.

_Scope: planning · runtime adapter: Claude_

## Procedure
1. Define domain modules, service boundaries, and the error model.
2. Specify every endpoint (API-###) with request/response schemas and codes.
3. Define idempotency, side effects, events, jobs, queues, observability, tests.

## Checklist
- [ ] Completed: Define domain modules, service boundaries, and the error model
- [ ] Completed: Specify every endpoint (API-###) with request/response schemas and codes
- [ ] Completed: Define idempotency, side effects, events, jobs, queues, observability, tests

## When NOT to use
- during implementation

## Quality bar
output is specific, testable, and traceable; no vague language

## Do not
- write product code
- expose secrets
- start implementation

> Canonical definition: `system-building-os/skills/planning/backend-api-planning.md`
