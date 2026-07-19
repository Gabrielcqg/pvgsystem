---
template_id: 40-frontend-state-inventory
title: Frontend State Inventory
phase: planning
runtime: claude
produces_artifact: frontend/frontend-states.yaml
schema: frontend-state
---

# Frontend State Inventory

## Instructions

Enumerate every non-trivial UI state as a first-class STATE-### with its trigger, data source, user feedback, and tests. Include AI states: constructing context, generating, validating, streaming, saving, retrying, provider unavailable.

## Required fields / sections

- State id (STATE-###)
- Name
- Applies to (screen/component)
- Kind
- Trigger
- UI representation
- Data source
- User feedback
- Exit transitions
- Acceptance criteria / tests

## Completeness checklist

- [ ] Every screen's declared states appear here
- [ ] AI generating/validating/streaming states present
- [ ] reconnecting/offline handled where applicable
- [ ] Validates against frontend-state.schema.json

## Fill below

> Replace this section with the actual content for the project.
