---
name: production-readiness-planning
description: "Prove every applicable vertical layer is planned, gated, and not superficial or deferred. Triggers: Phase 27-28."
---

# production-readiness-planning

Prove every applicable vertical layer is planned, gated, and not superficial or deferred.

_Scope: planning · runtime adapter: Claude_

## Procedure
1. Enumerate all layers and mark applicability + planned + implementation gate.
2. Require frontend when UI exists, DB when persistence, auth when private/roles, real AI path when AI is central.
3. Define the production-like run steps Codex must execute.
4. Fail readiness when an applicable layer is omitted, superficial, or delegated to Codex.
5. Validate against production-readiness + production-like-run schemas.

## Checklist
- [ ] Completed: Enumerate all layers and mark applicability + planned + implementation gate
- [ ] Completed: Require frontend when UI exists, DB when persistence, auth when private/roles, real AI path when AI is central
- [ ] Completed: Define the production-like run steps Codex must execute
- [ ] Completed: Fail readiness when an applicable layer is omitted, superficial, or delegated to Codex
- [ ] Completed: Validate against production-readiness + production-like-run schemas

## When NOT to use
- to mark IMPLEMENTATION_READY with an applicable layer missing

## Quality bar
output is specific, testable, and traceable; no vague language

## Do not
- write product code
- expose secrets
- start implementation

> Canonical definition: `system-building-os/skills/planning/production-readiness-planning.md`
