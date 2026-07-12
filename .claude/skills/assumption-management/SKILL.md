---
name: assumption-management
description: "Record and track every autonomously-resolved assumption. Triggers: Phase 7."
---

# assumption-management

Record and track every autonomously-resolved assumption.

_Scope: planning · runtime adapter: Claude_

## Procedure
1. For each Category B-D resolution create an ASM-### entry.
2. Record confidence, reason, source, reversibility, consequence-if-wrong.
3. Link assumptions to affected requirements.
4. Validate the ledger against assumption-ledger.schema.json.

## Checklist
- [ ] Completed: For each Category B-D resolution create an ASM-### entry
- [ ] Completed: Record confidence, reason, source, reversibility, consequence-if-wrong
- [ ] Completed: Link assumptions to affected requirements
- [ ] Completed: Validate the ledger against assumption-ledger

## When NOT to use
- during implementation

## Quality bar
output is specific, testable, and traceable; no vague language

## Do not
- write product code
- expose secrets
- start implementation

> Canonical definition: `system-building-os/skills/planning/assumption-management.md`
