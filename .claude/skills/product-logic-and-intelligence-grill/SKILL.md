---
name: product-logic-and-intelligence-grill
description: "Determine the central value and who owns each decision (AI vs deterministic vs frontend vs human). Triggers: mandatory after intent + system grill; AI-first or AI-assisted products."
---

# product-logic-and-intelligence-grill

Determine the central value and who owns each decision (AI vs deterministic vs frontend vs human).

_Scope: planning · runtime adapter: Claude_

## Procedure
1. Identify the actual central value and whether AI, rules, workflow, or a combination produces it.
2. For each step decide owner, decision_type, inputs, context, tools, output contract, fallback.
3. List decisions that must never be delegated to AI and the behavior when AI is unavailable.
4. Reject plans that replace intended AI-centered behavior with a fixed automated flow.
5. Emit the intelligence responsibility matrix (ai-responsibility-matrix.schema.json).

## Checklist
- [ ] Completed: Identify the actual central value and whether AI, rules, workflow, or a combination produces it
- [ ] Completed: For each step decide owner, decision_type, inputs, context, tools, output contract, fallback
- [ ] Completed: List decisions that must never be delegated to AI and the behavior when AI is unavailable
- [ ] Completed: Reject plans that replace intended AI-centered behavior with a fixed automated flow
- [ ] Completed: Emit the intelligence responsibility matrix (ai-responsibility-matrix

## When NOT to use
- to let a fixed workflow masquerade as AI
- to write 'use AI' without owner + contract

## Quality bar
output is specific, testable, and traceable; no vague language

## Do not
- write product code
- expose secrets
- start implementation

> Canonical definition: `system-building-os/skills/planning/product-logic-and-intelligence-grill.md`
