---
name: decision-resolution
description: "Classify every gap into Categories A-F and resolve or escalate correctly. Triggers: Phase 5-6."
---

# decision-resolution

Classify every gap into Categories A-F and resolve or escalate correctly.

_Scope: planning · runtime adapter: Claude_

## Procedure
1. Classify each missing decision A/B/C/D/E/F.
2. Resolve A-D autonomously; record C/D in the decision ledger.
3. Group all E questions into one round with recommended defaults.
4. Treat F as an external dependency, not a planning ambiguity.

## Checklist
- [ ] Completed: Classify each missing decision A/B/C/D/E/F
- [ ] Completed: Resolve A-D autonomously
- [ ] Completed: Group all E questions into one round with recommended defaults
- [ ] Completed: Treat F as an external dependency, not a planning ambiguity

## When NOT to use
- to ask questions Claude can answer itself

## Quality bar
output is specific, testable, and traceable; no vague language

## Do not
- write product code
- expose secrets
- start implementation

> Canonical definition: `system-building-os/skills/planning/decision-resolution.md`
