---
name: frontend-experience-review
kind: skill
scope: implementation
runtime_scope: [codex]
version: 1.1.0
---

# Skill: `frontend-experience-review`

**Purpose.** Independent frontend quality gate: is the UI product-expressive, complete, and reference-compliant?

**Scope:** implementation  ·  **Runtime:** codex

## Invocation triggers
- frontend experience review
- before frontend_experience_review_passed

## When not to use
- to pass because the page merely loaded

## Expected inputs
- relevant plan artifacts
- task/context as applicable

## Required context
focused context packet or planning artifact set

## Outputs
- artifact(s) and/or validation results with traceable IDs

## Procedure
1. Run the visual-quality-review checks across all dimensions.
2. Reject generic UIs, hidden product logic, dead space, and stretched-to-fill layouts.
3. Only pass frontend_experience_review_passed when the experience is complete and expressive.
4. Emit a visual-quality-review artifact with evidence.

## Checklist
- [ ] Completed: Run the visual-quality-review checks across all dimensions
- [ ] Completed: Reject generic UIs, hidden product logic, dead space, and stretched-to-fill layouts
- [ ] Completed: Only pass frontend_experience_review_passed when the experience is complete and expressive
- [ ] Completed: Emit a visual-quality-review artifact with evidence

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
- tests/fixtures/skills/frontend-experience-review.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'n/a', 'path': None}
- Codex: {'mechanism': 'skill', 'path': '.agents/skills/frontend-experience-review/SKILL.md'}
- Compatibility: Codex implementation skill; contains a runnable procedure.
