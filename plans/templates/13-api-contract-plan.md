---
template_id: 13-api-contract-plan
title: API & Contract Plan
phase: planning
runtime: claude
produces_artifact: 10-backend-api-plan.md + 24-api-contracts/
schema: api-contract
---

# API & Contract Plan

## Instructions

Every endpoint/procedure fully specified. Produce OpenAPI/JSON/event schemas where apt.

## Required fields / sections

- API ID
- Method
- Path
- Purpose
- Authentication/authorization
- Path/query params + headers
- Request/response schema
- Validation
- Success/error codes
- Idempotency
- Rate limits
- Side effects
- Database changes
- Events emitted
- Observability
- Tests

## Completeness checklist

- [ ] Every endpoint has an API-### id
- [ ] Request+response schemas defined
- [ ] Error codes enumerated
- [ ] Validates against api-contract.schema.json

## Fill below

> Replace this section with the actual content for the project.
