---
name: ai-flow-planning
description: "Specify AI behavior with exact inputs, outputs, and validation. Triggers: Phase 15."
---

# ai-flow-planning

Specify AI behavior with exact inputs, outputs, and validation.

_Scope: planning · runtime adapter: Claude_

## Procedure
1. Assign AI-### and state purpose and where deterministic logic is required.
2. Define inputs, context, tools, memory, and the output schema.
3. Define grounding/citations, hallucination, refusal, and fallback behavior.
4. Define token/latency/cost budgets and a model-independent interface.

## Checklist
- [ ] Completed: Assign AI-### and state purpose and where deterministic logic is required
- [ ] Completed: Define inputs, context, tools, memory, and the output schema
- [ ] Completed: Define grounding/citations, hallucination, refusal, and fallback behavior
- [ ] Completed: Define token/latency/cost budgets and a model-independent interface

## When NOT to use
- to write 'use AI to analyze the data' without a contract

## Quality bar
output is specific, testable, and traceable; no vague language

## Do not
- write product code
- expose secrets
- start implementation

> Canonical definition: `system-building-os/skills/planning/ai-flow-planning.md`
