# Policy: Production-Ready (strict definition)

"Production-ready" is a **complete vertical product**, not just working core logic
or a backend. A system is production-ready only when every **applicable** layer has
been planned, implemented, integrated, tested, and documented:

```
product behavior · business logic · AI behavior · frontend · backend · database ·
authentication · authorization · integrations · environment configuration ·
observability · security · performance · tests · deployment · rollback · documentation
```

## Mandatory-when-applicable
- **Frontend** is mandatory when the system has a user interface.
- **Database** implementation is mandatory when the system has persistence.
- **Authentication & authorization** are mandatory when access is private or role-based.
- **Real AI integration** is mandatory when the product's primary value depends on AI.

A plan must **not** receive `IMPLEMENTATION_READY`, and Codex must not declare
completion, when an applicable layer is **omitted, superficial, or delegated to
Codex to define**. See `production-readiness.yaml` (schema
`production-readiness.schema.json`) and the
[production-readiness evaluator](../evaluators/production-readiness-evaluator.md).

## Real AI integration (non-negotiable when AI is central)
The production path must be a real provider integration, never a scripted
conversation, fixed response sequence, or fake state machine:

```
frontend interaction → backend AI endpoint → input validation → context construction
→ provider-independent interface → concrete provider adapter → real provider API call
→ structured-output validation → domain validation → persistence → frontend response/stream
```

Requirements: a provider-independent interface **and** at least one concrete
adapter; timeout, retry, rate-limit handling; structured input/output schemas;
prompt contracts + versioning; streaming when required; token/cost logging; error
mapping; fallback; startup validation for missing configuration; `.env.example`
(names only, e.g. `OPENAI_API_KEY`, `OPENAI_MODEL`); production setup instructions;
tests with fakes/mocks plus an optional real-key integration test. Mocks/scripted
providers may exist **only** as test doubles, offline-dev adapters, CI substitutes,
or explicit demo mode — never as the default production implementation. Gate:
`real_ai_integration_verified`. See the
[AI-centrality evaluator](../evaluators/ai-centrality-evaluator.md).

## No fake completion
A feature is not complete when: backend exists but the frontend surface is missing;
frontend uses static/sample data in a production path; an API exists but is never
called; a database schema exists but is not integrated; an AI UI exists but
responses are scripted; auth screens exist but sessions are not enforced; buttons
do nothing; loading/error/empty states are absent; tests only cover mocks; the app
cannot run from documented setup; or a real provider adapter is missing when AI is
central. See the [fake-completion evaluator](../evaluators/fake-completion-evaluator.md).

## Gate separation
Planning completion may set the **planning** gates PASS (`active_plan_valid`,
`planning_package_complete`, `independent_plan_audit_passed`, `codex_handoff_valid`).
All **implementation** gates begin `PENDING` and may only become `PASS` when Codex
proves them with evidence — including `frontend_implemented`, `backend_implemented`,
`database_implemented`, `authentication_implemented`, `real_ai_integration_verified`,
`frontend_experience_review_passed`, and `production_like_run_verified`. A plan
validator fails if any implementation gate is marked PASS before implementation
(`scripts/validate_plan_package.py`). Canonical gates:
`system-building-os/contracts/completion-gates.yaml`.

## Production-like run
Before delivery Codex runs a clean production-like verification (install → init DB
→ migrate → configure non-secret env → build → start → health → core flows → auth →
persistence → AI config behavior → real-provider init when credentials present →
controlled behavior when absent → inspect logs/console/failed requests → security +
performance checks → evidence). Gate: `production_like_run_verified`.
