---
name: ai-output-validation
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.0.0
---

# Skill: `ai-output-validation`

**Purpose.** Validate AI outputs against schema and evals.

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
1. Validate every AI output against its output schema.
2. Run golden and red-team evals; enforce thresholds.
3. Trigger fallback/refusal behavior on low confidence.

## Checklist
- [ ] Completed: Validate every AI output against its output schema
- [ ] Completed: Run golden and red-team evals
- [ ] Completed: Trigger fallback/refusal behavior on low confidence

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
- tests/fixtures/skills/ai-output-validation.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/ai-output-validation/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
