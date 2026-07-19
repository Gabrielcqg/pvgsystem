---
name: product-logic-and-intelligence-grill
kind: skill
scope: planning
runtime_scope: [claude]
version: 1.1.0
---

# Skill: `product-logic-and-intelligence-grill`

**Purpose.** Determine the central value and who owns each decision (AI vs deterministic vs frontend vs human).

**Scope:** planning  ·  **Runtime:** claude

## Invocation triggers
- mandatory after intent + system grill
- AI-first or AI-assisted products

## When not to use
- to let a fixed workflow masquerade as AI
- to write 'use AI' without owner + contract

## Expected inputs
- relevant plan artifacts
- task/context as applicable

## Required context
focused context packet or planning artifact set

## Outputs
- artifact(s) and/or validation results with traceable IDs

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

## Quality bar
output is specific, testable, and traceable; no vague language

## Failure conditions
- missing required fields
- vague/untestable output
- secret exposure
- scope violation

## Allowed tools
- read
- write_planning_artifacts
- search

## Disallowed actions
- write product code
- expose secrets
- start implementation

## Tool access
planning (read + write artifacts)

## Test fixtures
- tests/fixtures/skills/product-logic-and-intelligence-grill.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'skill', 'path': '.claude/skills/product-logic-and-intelligence-grill/SKILL.md'}
- Codex: {'mechanism': 'n/a', 'path': None}
- Compatibility: Claude planning skill; primary planning belongs to Claude.
