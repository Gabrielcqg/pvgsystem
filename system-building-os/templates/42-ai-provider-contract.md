---
template_id: 42-ai-provider-contract
title: AI Provider Contract
phase: planning
runtime: claude
produces_artifact: ai/ai-provider-contract.yaml
schema: ai-provider-contract
---

# AI Provider Contract

## Instructions

When the product depends on an external AI provider, specify a production-capable integration behind a provider-independent interface WITH at least one concrete adapter. Mock/scripted providers may exist only as test doubles / offline-dev / CI / explicit demo — never as the default production path.

## Required fields / sections

- Provider
- Provider-independent interface
- Concrete adapter
- Model env var + API key env var (names only)
- Model config
- Timeout / retry / rate-limit handling
- Structured output + input/output schema
- Prompt contract + prompt versioning
- Streaming
- Token/cost logging
- Error mapping
- Fallback behavior
- Startup validation for missing config
- Mock-mode policy
- .env.example keys (names only)
- Production setup instructions
- Tests (fakes + optional real-key integration test)

## Completeness checklist

- [ ] Provider-independent interface + concrete adapter both specified
- [ ] Runnable after configuring named env vars
- [ ] Startup validation for missing config
- [ ] Mock mode is not the production default
- [ ] Secrets by env-var name only
- [ ] Validates against ai-provider-contract.schema.json

## Fill below

> Replace this section with the actual content for the project.
