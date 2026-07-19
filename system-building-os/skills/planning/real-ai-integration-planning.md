---
name: real-ai-integration-planning
kind: skill
scope: planning
runtime_scope: [claude]
version: 1.1.0
---

# Skill: `real-ai-integration-planning`

**Purpose.** Specify a production-capable AI provider integration and the centrality tests that prove it.

**Scope:** planning  ·  **Runtime:** claude

## Invocation triggers
- Phase 15 when AI is central

## When not to use
- to plan a scripted/fake production AI path
- to place secret values anywhere

## Expected inputs
- relevant plan artifacts
- task/context as applicable

## Required context
focused context packet or planning artifact set

## Outputs
- artifact(s) and/or validation results with traceable IDs

## Procedure
1. Define the provider-independent interface AND a concrete provider adapter.
2. Specify env-var names, timeout, retry, rate-limit, structured output, prompt versioning.
3. Enumerate the production path frontend->endpoint->validation->context->interface->adapter->provider->output validation->persistence->response/stream.
4. Define centrality tests and forbid scripted production conversations.
5. Define startup validation and mock-mode policy (never the production default).
6. Validate against ai-provider-contract + real-ai-integration-plan schemas.

## Checklist
- [ ] Completed: Define the provider-independent interface AND a concrete provider adapter
- [ ] Completed: Specify env-var names, timeout, retry, rate-limit, structured output, prompt versioning
- [ ] Completed: Enumerate the production path frontend->endpoint->validation->context->interface->adapter->provider->output validation->persistence->response/stream
- [ ] Completed: Define centrality tests and forbid scripted production conversations
- [ ] Completed: Define startup validation and mock-mode policy (never the production default)
- [ ] Completed: Validate against ai-provider-contract + real-ai-integration-plan schemas

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
- tests/fixtures/skills/real-ai-integration-planning.fixture.md

## Runtime adapters
- Claude: {'mechanism': 'skill', 'path': '.claude/skills/real-ai-integration-planning/SKILL.md'}
- Codex: {'mechanism': 'n/a', 'path': None}
- Compatibility: Claude planning skill; primary planning belongs to Claude.
