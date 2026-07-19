# Production Readiness Evaluator

Owned during planning by `production-readiness-planning` and during implementation
by the `production-verification-agent`. Gates `production_like_run_verified` and,
at planning time, contributes to `planning_package_complete`.

## Planning check (production-readiness.yaml)
Every applicable vertical layer is enumerated, marked applicable + planned, and
bound to an implementation gate. A plan is rejected when an applicable layer is
omitted, superficial, or delegated to Codex to define. Mandatory-when-applicable:
frontend (UI present), database (persistence present), authentication (private or
role-based access), real AI integration (AI is central).

## Implementation check (production-like-run)
Codex must run the clean, production-like verification and attach evidence:
1. install dependencies from a clean state;
2. initialize the database and apply migrations;
3. configure non-secret environment values;
4. build frontend and backend; start the application;
5. verify health endpoints;
6. run core browser flows; verify authentication; verify database persistence;
7. verify AI configuration behavior; verify real-provider initialization when
   credentials are present and controlled behavior when absent;
8. inspect logs, browser console, and failed network requests;
9. run security and performance checks; produce evidence.

The gate must not pass because the app "started"; it passes only with captured
evidence for each applicable step. Artifacts: `production-readiness.yaml`,
`production-like-run` steps. Skill: `production-like-run-verification`.
