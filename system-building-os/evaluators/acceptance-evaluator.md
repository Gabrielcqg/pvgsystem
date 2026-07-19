# Final Acceptance Evaluator

Owned by the independent, read-only `final-acceptance-judge`. Walks the
traceability graph: requirement -> task -> files and requirement -> acceptance ->
test -> evidence. Reopens any missing/failing criterion. Prevents false
completion. Uses `27-requirement-traceability.yaml`, `vertical-traceability.yaml`,
`implementation-deliverables.yaml`, and the acceptance criteria file. Skills:
`final-plan-comparison`, `acceptance-criteria-validation`.

Also enforces the [fake-completion-evaluator](fake-completion-evaluator.md): a
feature is not complete when the backend exists without a frontend surface, the
frontend uses static data, an API is never called, the AI path is scripted,
sessions are not enforced, states are missing, tests only cover mocks, or the app
cannot run from the documented setup. For AI-central products it enforces the
[ai-centrality-evaluator](ai-centrality-evaluator.md) and the gate
`real_ai_integration_verified`; for UI products it enforces
`frontend_experience_review_passed`; for every product it enforces
`production_like_run_verified`.
