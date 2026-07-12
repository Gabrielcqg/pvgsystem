# Codex Handoff — ai-saas

Implementation brief: build the system exactly as specified in `05-product-system-plan.md`. Execute `18-task-manifest.yaml` in dependency order using each task's assigned agent and skills. Respect `22-file-ownership.yaml`. Run each task's validation commands; repair failures via the recovery loop. Do not change product behavior.

Order: TASK-001 -> TASK-002 -> TASK-003 -> TASK-004 -> TASK-005

Non-negotiable rules: never expose secrets; keep scope; record deviations; do not complete until the listed completion gates pass; use the final-acceptance-judge before delivery.

Active plan version 1.0.0 (hash sha256:example-aisaas-0001).
