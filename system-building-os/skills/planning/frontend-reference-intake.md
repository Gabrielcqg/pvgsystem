---
name: frontend-reference-intake
kind: skill
scope: planning
runtime_scope: [claude]
version: 1.1.0
---

# Skill: `frontend-reference-intake`

**Purpose.** Inspect and incorporate the project's frontend reference package before frontend planning.

**Scope:** planning  ·  **Runtime:** claude

## Invocation triggers
- Phase 12 (before frontend planning)

## When not to use
- to overwrite user references
- to ask reversible visual choices

## Expected inputs
- relevant plan artifacts
- task/context as applicable

## Required context
focused context packet or planning artifact set

## Outputs
- artifact(s) and/or validation results with traceable IDs

## Procedure
1. Read project-reference/frontend/ (FRONTEND_REFERENCE.md, design-tokens.yaml, screen-inventory.yaml, assets/, inspiration/).
2. Classify each reference MUST_FOLLOW/STRONG_INSPIRATION/GENERAL_INSPIRATION/AVOID.
3. If absent/empty, infer a direction from the product and propose a reference file.
4. Ask only grouped material visual questions when identity changes substantially.
5. Record provenance (user/references/inference) for each decision.

## Checklist
- [ ] Completed: Read project-reference/frontend/ (FRONTEND_REFERENCE
- [ ] Completed: Classify each reference MUST_FOLLOW/STRONG_INSPIRATION/GENERAL_INSPIRATION/AVOID
- [ ] Completed: If absent/empty, infer a direction from the product and propose a reference file
- [ ] Completed: Ask only grouped material visual questions when identity changes substantially
- [ ] Completed: Record provenance (user/references/inference) for each decision

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
- tests/fixtures/skills/frontend-reference-intake.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'skill', 'path': '.claude/skills/frontend-reference-intake/SKILL.md'}
- Codex: {'mechanism': 'n/a', 'path': None}
- Compatibility: Claude planning skill; primary planning belongs to Claude.
