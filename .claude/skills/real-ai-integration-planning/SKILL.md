---
name: real-ai-integration-planning
description: "Specify a production-capable AI provider integration and the centrality tests that prove it. Triggers: Phase 15 when AI is central."
---

# real-ai-integration-planning

Specify a production-capable AI provider integration and the centrality tests that prove it.

_Scope: planning · runtime adapter: Claude_

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

## When NOT to use
- to plan a scripted/fake production AI path
- to place secret values anywhere

## Quality bar
output is specific, testable, and traceable; no vague language

## Do not
- write product code
- expose secrets
- start implementation

> Canonical definition: `system-building-os/skills/planning/real-ai-integration-planning.md`
