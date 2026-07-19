---
name: ai-flow-planning
kind: skill
scope: planning
runtime_scope: [claude]
version: 1.1.0
---

# Skill: `ai-flow-planning`

**Purpose.** Specify AI behavior with exact inputs, outputs, and validation.

**Scope:** planning  ·  **Runtime:** claude

## Invocation triggers
- Phase 15

## When not to use
- to write 'use AI to analyze the data' without a contract

## Expected inputs
- relevant plan artifacts
- task/context as applicable

## Required context
focused context packet or planning artifact set

## Outputs
- artifact(s) and/or validation results with traceable IDs

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
- tests/fixtures/skills/ai-flow-planning.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'skill', 'path': '.claude/skills/ai-flow-planning/SKILL.md'}
- Codex: {'mechanism': 'n/a', 'path': None}
- Compatibility: Claude planning skill; primary planning belongs to Claude.
