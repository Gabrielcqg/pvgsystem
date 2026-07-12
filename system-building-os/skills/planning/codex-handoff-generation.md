---
name: codex-handoff-generation
kind: skill
scope: planning
runtime_scope: [claude]
version: 1.0.0
---

# Skill: `codex-handoff-generation`

**Purpose.** Produce a self-contained Codex handoff and start file.

**Scope:** planning  ·  **Runtime:** claude

## Invocation triggers
- Phase 27

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
1. Write the implementation brief and exact order.
2. Reference the task manifest and context packets.
3. State non-negotiable rules and the completion report format.
4. Ensure no material decision lives only in chat history.

## Checklist
- [ ] Completed: Write the implementation brief and exact order
- [ ] Completed: Reference the task manifest and context packets
- [ ] Completed: State non-negotiable rules and the completion report format
- [ ] Completed: Ensure no material decision lives only in chat history

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
- tests/fixtures/skills/codex-handoff-generation.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'skill', 'path': '.claude/skills/codex-handoff-generation/SKILL.md'}
- Codex: {'mechanism': 'n/a', 'path': None}
- Compatibility: Claude planning skill; primary planning belongs to Claude.
