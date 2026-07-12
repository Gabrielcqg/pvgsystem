---
name: assumption-management
kind: skill
scope: planning
runtime_scope: [claude]
version: 1.0.0
---

# Skill: `assumption-management`

**Purpose.** Record and track every autonomously-resolved assumption.

**Scope:** planning  ·  **Runtime:** claude

## Invocation triggers
- Phase 7

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
1. For each Category B-D resolution create an ASM-### entry.
2. Record confidence, reason, source, reversibility, consequence-if-wrong.
3. Link assumptions to affected requirements.
4. Validate the ledger against assumption-ledger.schema.json.

## Checklist
- [ ] Completed: For each Category B-D resolution create an ASM-### entry
- [ ] Completed: Record confidence, reason, source, reversibility, consequence-if-wrong
- [ ] Completed: Link assumptions to affected requirements
- [ ] Completed: Validate the ledger against assumption-ledger

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
- tests/fixtures/skills/assumption-management.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'skill', 'path': '.claude/skills/assumption-management/SKILL.md'}
- Codex: {'mechanism': 'n/a', 'path': None}
- Compatibility: Claude planning skill; primary planning belongs to Claude.
