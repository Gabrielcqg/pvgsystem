---
template_id: 35-product-intelligence-grill
title: Product Logic & Intelligence Grill
phase: planning
runtime: claude
produces_artifact: 35-product-intelligence-grill.md + ai-responsibility-matrix.yaml
schema: ai-responsibility-matrix
---

# Product Logic & Intelligence Grill

## Instructions

Mandatory. Determine the actual central value of the system and WHO owns each decision (ai / deterministic_backend / frontend / human). Reject any plan that replaces intended AI-centered behavior with a fixed automated flow. Produce the intelligence responsibility matrix.

## Required fields / sections

- What is the central value of the system?
- Is the central value produced by deterministic workflow, rules, AI, or a combination?
- Which decisions MUST be made by AI?
- Which decisions must NEVER be delegated to AI?
- Which steps require interpretation vs automation?
- Which steps depend on accumulated interaction context?
- Which steps are static vs must adapt dynamically?
- Which steps require tools or external information?
- Which steps require human review?
- What would make this feel like a normal workflow instead of an AI-first product?
- How must the product behave when AI is unavailable? Minimum deterministic fallback?
- What part of the experience proves the intelligence is actually working?
- Responsibility matrix: step_id/description/owner/decision_type/inputs/context/tools/output_contract/validation/fallback/user_visible_effect

## Completeness checklist

- [ ] Central value + owner stated
- [ ] AI-vs-deterministic responsibility explicit per step
- [ ] Decisions never delegated to AI listed
- [ ] Behavior when AI unavailable defined
- [ ] Intelligence proof identified
- [ ] Not a disguised fixed workflow when AI is the point
- [ ] Validates against ai-responsibility-matrix.schema.json

## Fill below

> Replace this section with the actual content for the project.
