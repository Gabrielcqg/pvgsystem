---
template_id: 46-production-readiness
title: Production Readiness Matrix
phase: planning
runtime: claude
produces_artifact: production-readiness.yaml
schema: production-readiness
---

# Production Readiness Matrix

## Instructions

Enumerate every vertical layer, mark applicability, confirm it is planned, and bind it to an implementation gate. A plan is not production-ready when an applicable layer is omitted, superficial, or delegated to Codex to define.

## Required fields / sections

- Per layer: layer/applicable/planned/implementation_gate/evidence/notes
- Layers: product_behavior, business_logic, ai_behavior, frontend, backend, database, authentication, authorization, integrations, environment_configuration, observability, security, performance, tests, deployment, rollback, documentation
- definition_satisfied (bool)

## Completeness checklist

- [ ] Every applicable layer planned + gated
- [ ] No applicable layer superficial or deferred
- [ ] Frontend mandatory when there is a UI; DB when persistence; auth when private/roles; real AI path when AI is central
- [ ] Validates against production-readiness.schema.json

## Fill below

> Replace this section with the actual content for the project.
