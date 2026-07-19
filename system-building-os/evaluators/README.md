# Evaluators

Independent evaluation logic used to gate quality. Each evaluator has a canonical
definition here and a runnable implementation in `scripts/`.

| Evaluator                 | Definition                          | Implementation                         |
|---------------------------|-------------------------------------|----------------------------------------|
| Plan consistency          | plan-consistency-evaluator.md       | scripts/validate_plan_package.py + skill `plan-consistency-validation` |
| Completion gates          | completion-gate-evaluator.md        | scripts/evaluate_completion_gates.py   |
| Final acceptance          | acceptance-evaluator.md             | agent `final-acceptance-judge` + skills `final-plan-comparison`, `acceptance-criteria-validation` |
| Runtime parity            | runtime-parity-evaluator.md         | scripts/validate_runtime_parity.py     |
| Vertical traceability     | vertical-traceability-evaluator.md  | scripts/validate_plan_package.py + skill `cross-layer-reconciliation` |
| Frontend experience       | frontend-experience-evaluator.md    | agent `frontend-experience-reviewer` + skills `frontend-experience-review`, `visual-regression` |
| AI centrality             | ai-centrality-evaluator.md          | skills `product-logic-and-intelligence-grill`, `real-ai-integration-planning`, `ai-interface-implementation` |
| Fake completion           | fake-completion-evaluator.md        | agent `final-acceptance-judge` (extended) |
| Production readiness       | production-readiness-evaluator.md   | agent `production-verification-agent` + skill `production-like-run-verification` |

Evaluators must be independent from the producer they judge (separate context).
The plan-consistency, vertical-traceability, frontend-experience, AI-centrality,
fake-completion, and production-readiness evaluators are all embedded in
`/plan_max` (planning) and in the Codex acceptance path (implementation).
