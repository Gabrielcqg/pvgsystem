---
template_id: 39-interaction-contract
title: Frontend-to-Backend Interaction Contracts
phase: planning
runtime: claude
produces_artifact: frontend/interaction-contracts.yaml
schema: interaction-contract
---

# Frontend-to-Backend Interaction Contracts

## Instructions

For every user interaction, bind the frontend action to its backend/local behavior end to end. Reject buttons with no implementation contract and backend features with no user surface (unless explicitly administrative, background-only, or API-only).

## Required fields / sections

- Interaction id (IX-###)
- screen_id/component_id
- user_action
- frontend_validation
- request_contract
- backend_handler
- business_rule
- ai_behavior
- database_effect
- success_response
- error_responses
- loading_state/streaming_state/retry_behavior/optimistic_behavior
- user_feedback
- analytics_event
- acceptance_criteria / tests

## Completeness checklist

- [ ] Every user-facing action maps to a backend or local behavior
- [ ] Every user-visible backend capability maps to a surface (unless admin/background/API-only)
- [ ] No placeholder/fake-data contracts
- [ ] Validates against interaction-contract.schema.json

## Fill below

> Replace this section with the actual content for the project.
