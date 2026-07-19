# How to Configure Production
Production is policy-driven via profiles (`policies/production-autonomy.md`):
`local_full_autonomy`, `development_full_autonomy`, `staging_full_autonomy`,
`production_managed_autonomy`. The managed profile requires pre-deploy checks,
backup verification, expand-and-contract migrations, canary rollout, automatic
rollback, and post-deploy validation. Missing prod credentials never block local
work — a deployment-ready package is produced instead.

## Production-ready means a complete vertical product
See `system-building-os/policies/production-ready.md`. Every applicable layer
(frontend, backend, database, auth, real AI path, observability, security,
performance, deployment, rollback, docs) must be planned, implemented, tested, and
documented. `production-readiness.yaml` marks each applicable layer planned and
bound to an implementation gate; a plan that omits, ships superficially, or defers
an applicable layer is not production-ready.

## Real AI provider integration
When the product's value depends on external AI, the implementation must run the
**real** provider path from named environment variables (e.g. `OPENAI_API_KEY`,
`OPENAI_MODEL`) behind a provider-independent interface with a concrete adapter,
startup validation, structured output, retries, and fallback. Mocks are test
doubles / offline-dev / CI / explicit demo only — never the production default.
Gate: `real_ai_integration_verified`.

## Production-like run verification
Before delivery Codex runs a clean production-like verification (install → init DB →
migrate → configure non-secret env → build → start → health → core flows → auth →
persistence → AI config behavior with credentials present and absent → inspect
logs/console/failed requests → security + performance checks → evidence). Gate:
`production_like_run_verified`. Never mark it PASS because the app merely started.
