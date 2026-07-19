---
template_id: 44-vertical-traceability
title: Vertical Traceability
phase: planning
runtime: claude
produces_artifact: vertical-traceability.yaml
schema: vertical-traceability
---

# Vertical Traceability

## Instructions

Prove how each user-facing requirement travels through EVERY applicable layer: goal -> product requirement -> business rule -> AI/deterministic responsibility -> backend service -> database entity/integration -> API contract -> frontend surface -> frontend state -> acceptance criterion -> test -> evidence. Validation fails when an applicable layer is missing.

## Required fields / sections

- Per requirement: requirement_id/goal_id
- business_rules
- ai_behaviors
- backend_components
- database_entities
- api_contracts
- frontend_surfaces
- frontend_states
- acceptance_criteria
- tests
- evidence
- layers_applicable map (which layers apply to this product)

## Completeness checklist

- [ ] Every user-facing requirement maps across all applicable layers
- [ ] No applicable layer omitted for any requirement
- [ ] Frontend surfaces + states present for UI requirements
- [ ] AI behaviors present for AI requirements
- [ ] Validates against vertical-traceability.schema.json

## Fill below

> Replace this section with the actual content for the project.
