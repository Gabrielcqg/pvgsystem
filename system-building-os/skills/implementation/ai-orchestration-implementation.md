---
name: ai-orchestration-implementation
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.0.0
---

# Skill: `ai-orchestration-implementation`

**Purpose.** Implement AI flows behind model-independent interfaces.

**Scope:** implementation  ·  **Runtime:** codex

## Invocation triggers
- AI tasks

## When not to use
- during product discovery

## Expected inputs
- relevant plan artifacts
- task/context as applicable

## Required context
focused context packet or planning artifact set

## Outputs
- artifact(s) and/or validation results with traceable IDs

## Procedure
1. Implement prompt/tool/memory contracts and structured output.
2. Add validation and fallback per the AI plan.
3. Keep the model behind an interface for substitution.

## Checklist
- [ ] Completed: Implement prompt/tool/memory contracts and structured output
- [ ] Completed: Add validation and fallback per the AI plan
- [ ] Completed: Keep the model behind an interface for substitution

## Quality bar
output is specific, testable, and traceable; no vague language

## Failure conditions
- missing required fields
- vague/untestable output
- secret exposure
- scope violation

## Allowed tools
- read
- write
- run_tests
- run_validations

## Disallowed actions
- expose secrets
- reinterpret product scope

## Tool access
implementation (read/write/run)

## Test fixtures
- tests/fixtures/skills/ai-orchestration-implementation.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/ai-orchestration-implementation/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
