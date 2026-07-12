---
name: database-selection
description: "Select the database from requirements, not by default. Triggers: Phase 10."
---

# database-selection

Select the database from requirements, not by default.

_Scope: planning · runtime adapter: Claude_

## Procedure
1. Map requirements to relational/document/kv/graph/vector/search/cache needs.
2. Recommend a database + provider with rationale and alternatives.
3. Define local/test/staging/production database strategy.

## Checklist
- [ ] Completed: Map requirements to relational/document/kv/graph/vector/search/cache needs
- [ ] Completed: Recommend a database + provider with rationale and alternatives
- [ ] Completed: Define local/test/staging/production database strategy

## When NOT to use
- to force one database on every project

## Quality bar
output is specific, testable, and traceable; no vague language

## Do not
- write product code
- expose secrets
- start implementation

> Canonical definition: `system-building-os/skills/planning/database-selection.md`
