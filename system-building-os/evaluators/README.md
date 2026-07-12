# Evaluators

Independent evaluation logic used to gate quality. Each evaluator has a canonical
definition here and a runnable implementation in `scripts/`.

| Evaluator                 | Definition                          | Implementation                         |
|---------------------------|-------------------------------------|----------------------------------------|
| Plan consistency          | plan-consistency-evaluator.md       | scripts/validate_plan_package.py + skill `plan-consistency-validation` |
| Completion gates          | completion-gate-evaluator.md        | scripts/evaluate_completion_gates.py   |
| Final acceptance          | acceptance-evaluator.md             | agent `final-acceptance-judge` + skills `final-plan-comparison`, `acceptance-criteria-validation` |
| Runtime parity            | runtime-parity-evaluator.md         | scripts/validate_runtime_parity.py     |

Evaluators must be independent from the producer they judge (separate context).
