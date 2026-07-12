---
name: ai-evaluation-planning
kind: skill
scope: planning
runtime_scope: [claude]
version: 1.0.0
---

# Skill: `ai-evaluation-planning`

**Purpose.** Plan AI evaluation with golden and red-team cases.

**Scope:** planning  ·  **Runtime:** claude

## Invocation triggers
- Phase 15

## When not to use
- during implementation

## Expected inputs
- relevant plan artifacts
- task/context as applicable

## Required context
focused context packet or planning artifact set

## Outputs
- artifact(s) and/or validation results with traceable IDs

## Procedure
1. Define golden test cases and expected outputs.
2. Define red-team / prompt-injection cases.
3. Define quality metrics and pass thresholds mapped to acceptance criteria.

## Checklist
- [ ] Completed: Define golden test cases and expected outputs
- [ ] Completed: Define red-team / prompt-injection cases
- [ ] Completed: Define quality metrics and pass thresholds mapped to acceptance criteria

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
- tests/fixtures/skills/ai-evaluation-planning.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'skill', 'path': '.claude/skills/ai-evaluation-planning/SKILL.md'}
- Codex: {'mechanism': 'n/a', 'path': None}
- Compatibility: Claude planning skill; primary planning belongs to Claude.
