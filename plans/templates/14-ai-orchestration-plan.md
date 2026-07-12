---
template_id: 14-ai-orchestration-plan
title: AI Orchestration Plan
phase: planning
runtime: claude
produces_artifact: 11-ai-plan.md
schema: ai-flow
---

# AI Orchestration Plan

## Instructions

When AI is involved. Never 'use AI to analyze data' — specify exact I/O + validation.

## Required fields / sections

- AI components/agents
- Orchestration
- Prompt contracts
- Tool contracts
- Context construction
- Memory strategy
- Retrieval/grounding
- Structured output schema
- Validation
- Uncertainty/confidence
- Hallucination reduction
- Refusal + fallback behavior
- Fallback models / model-independent interfaces
- Evaluation datasets (golden + red-team)
- Prompt injection protections
- Data exposure protections
- Token/latency/cost budgets
- Retry & repair loops
- Prompt versioning
- Human review when relevant

## Completeness checklist

- [ ] Exact inputs/outputs specified
- [ ] Output schema defined
- [ ] Validation defined
- [ ] Golden + red-team evals present
- [ ] Fallback behavior defined
- [ ] Validates against ai-flow.schema.json

## Fill below

> Replace this section with the actual content for the project.
