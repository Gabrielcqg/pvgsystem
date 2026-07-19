---
description: Deepen AI responsibility, prompts, tools, memory, retrieval, evaluations, and the real provider integration for the active plan. Refinement only.
argument-hint: [focus area | "audit"]
---

# /plan_ai_max

Specialist refinement of the **AI** dimension of the active plan. Optional:
`/plan_max` already runs the intelligence grill and the real-AI-integration plan
when AI is central.

## User input
$ARGUMENTS

## How to run
Load the active plan. Use the `ai-orchestration-architect` subagent and invoke:
1. `product-logic-and-intelligence-grill` — reconfirm the AI-vs-deterministic responsibility matrix; ensure AI (not a fixed sequence) owns the decisions that are the product's value.
2. `ai-flow-planning` + `ai-evaluation-planning` — exact I/O, output schema, grounding, refusal, golden + red-team evals.
3. `real-ai-integration-planning` — provider-independent interface **and** a concrete adapter; env-var names; timeout/retry/rate-limit; structured output; prompt versioning; the full production path; **centrality tests**; startup validation; mock-mode policy (never the production default).

## Rules
- Do not write product code. Never expose secrets — env-var names only.
- Scripted/fake production conversations are forbidden; the real provider path must be runnable from named env vars.
- The completion gate `real_ai_integration_verified` applies whenever the product's value depends on external AI.

## Finish by
Reporting the provider contract + centrality tests and running
`python3 scripts/validate_plan_package.py plans/active/<slug>`.
