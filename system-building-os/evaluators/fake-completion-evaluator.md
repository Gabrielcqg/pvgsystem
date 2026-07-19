# Fake-Completion Evaluator

Extends the independent `final-acceptance-judge`. A feature is **not** complete —
and the plan/implementation is not production-ready — when any of the following
hold. The judge detects these conditions and reopens the relevant work:

- backend exists but the frontend surface is missing (representation required);
- frontend uses static/sample data instead of real API/AI results in a production path;
- an API exists but is never called by any surface;
- a database schema exists but is not integrated;
- an AI UI exists but responses are scripted/faked;
- authentication screens exist but sessions are not enforced;
- buttons/actions exist but do nothing (no interaction contract wired);
- loading, error, or empty states are absent;
- tests only cover mocks (no real path exercised);
- environment setup is incomplete or the app cannot run from documented setup;
- a real provider adapter is missing when AI is central.

Inputs: `vertical-traceability.yaml`, `implementation-deliverables.yaml`,
`production-readiness.yaml`, interaction contracts, and the acceptance criteria.
Gates: `final_acceptance_judge_passed`, plus the layer gates
(`frontend_implemented`, `backend_implemented`, `database_implemented`,
`authentication_implemented`, `real_ai_integration_verified`,
`frontend_experience_review_passed`, `production_like_run_verified`).
