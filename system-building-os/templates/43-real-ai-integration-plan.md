---
template_id: 43-real-ai-integration-plan
title: Real AI Integration Plan
phase: planning
runtime: claude
produces_artifact: ai/real-ai-integration-plan.yaml
schema: real-ai-integration-plan
---

# Real AI Integration Plan

## Instructions

When AI is the product's central value, define the full production path and the centrality tests that prove the AI (not a fixed sequence) is responsible for behavior.

## Required fields / sections

- AI is central? (bool)
- Production path: frontend -> AI endpoint -> validation -> context -> interface -> adapter -> provider call -> structured-output validation -> domain validation -> persistence -> frontend response/stream
- Provider contract ref
- Responsibility matrix ref
- Frontend AI states
- Centrality tests (different context -> different behavior; not a fixed sequence; uses stored context; schema-valid output; invalid output rejected/repaired; tools influence output; fallback on failure; mock not active in prod; adapter initializes with credentials)
- Required env vars (names only)
- Mock policy
- Setup instructions

## Completeness checklist

- [ ] Full production path enumerated
- [ ] Centrality tests present and meaningful
- [ ] Env vars named (no values)
- [ ] Mock policy forbids scripted production conversation
- [ ] completion gate real_ai_integration_verified referenced
- [ ] Validates against real-ai-integration-plan.schema.json

## Fill below

> Replace this section with the actual content for the project.
