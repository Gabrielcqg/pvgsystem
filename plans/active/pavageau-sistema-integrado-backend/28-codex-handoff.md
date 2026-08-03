# 28 — Codex Handoff

**Plan:** `pavageau-sistema-integrado-backend` · **v3.4.0**
Backend + database for the Sistema Integrado Pavageau. **Frontend is not built here** (DEC-14).

---

## Read before writing any code

1. `runtime/00-repository-context.md` — what exists, what does not, and one retracted finding
2. `04-decision-ledger.md` — **52 decisions**; **do not reopen**
2b. `vendor/PROVENANCE.md` — the canonical scraper is already in this package; do not go looking for it
3. `07-data-architecture-plan.md` — the schema, the derived formulas (§5), the recalculation rules (§6)
4. `13-api-contract-plan.md` — **§0 runtime identity** and **§1.1 write allowlists** are security controls, not style
5. `15-integration-plan.md` — the scraper seam, the orchestrator sequence, `CONCLUSIVO`
6. `23-task-decomposition.md` — execution order (prose) · **`18-task-manifest.yaml`** — the executable graph (`phase` + `dependencies`). Where they differ, **the manifest wins**.
7. `22-file-ownership.yaml` — write boundaries. **Precedence: the most specific matching path wins**
   (`docs/evidence/**` beats `docs/**`). An agent may only create files under a path it owns.

## VISUAL REPLACEMENT — the authenticated app MUST reproduce `pavageau_v2.jsx` (runtime/63)

> The built `frontend/src` (2235-line `App.jsx`, generic look) is **replaced at the presentation
> layer** by a faithful reproduction of `vendor/frontend/pavageau_v2.jsx` — sidebar, header, layout,
> tables, cards, modals, forms, tokens, density — **one component per view**. **Preserve** `lib/api.js`,
> `lib/supabase.js`, `lib/config.js`, session/JWT, route guards, endpoint contracts, filters, mutations,
> business rules, existing tests, and the approved **login/esqueci/redefinir** screens. Connect every
> fake element of the reference to its real API equivalent (runtime/63 §4). No production mocks, no dead
> buttons, calculated values stay read-only. Not done while the authenticated app still looks generic.

## EXECUTION SCOPE — FRONTEND-FOCUSED (authoritative: `runtime/62-frontend-execution-scope.md`)

> **Build the frontend; preserve the backend.** Baseline = commit `af9c5d3b` (validated). Codex builds:
> **(1) the full frontend** from the vendored reference (all screens/states, Supabase Auth, real FastAPI
> integration, tests + E2E — tasks T-FE-01…T-FE-09); **(2) only these ADDITIVE endpoints** (thin wrappers
> over existing `PostgresService`/orchestrator — `runtime/62 §2`): `GET /me`, `POST /radar/executar`,
> `GET /radar/execucoes|/{id}|/ultima|/movimentacoes-novas`, `GET /auditoria`, `GET /contratos/{id}`.
>
> **Everything else is DONE — verify, never rebuild/refactor:** schema, migrations, RLS, `app_members`,
> `radar_worker`, radar, loader, scraper (frozen `c9429f2a…`), ES256/JWKS auth, and **the generic CRUD**
> for parceiros/contratos/lançamentos/custos-fixos/tarefas/processos (already wired via
> `_collection_routes` — **do NOT recreate it**; the frontend consumes it directly).
>
> No migration is recreated/duplicated (source = `supabase/migrations/` only). Deploy non-negotiable:
> `SUPABASE_JWT_SECRET` must be set so auth is fail-closed (DEC-54).

## Reconciliation with the live repo (plan_audit 2026-07-21, commit 7be04107)

> **BACKEND IS ALREADY IMPLEMENTED — PRESERVE, DO NOT REGRESS.** Backend Phases 0-6 (schema, RLS,
> `app_members`, `radar_worker`, SECURITY DEFINER fns, domain/calc/radar/loader, the 19 endpoints,
> the frozen scraper) are **done and applied to Supabase**. See `runtime/60-repo-reconciliation.md`.
> Codex's action for Phases 0-6 is **verify present, do not rebuild**.
>
> **Migration source of truth: `supabase/migrations/` (timestamped) ONLY.** The legacy
> `migrations/000-011` directory is REMOVED. Every mention of `000_bootstrap.sql … 011_watchdog.sql`
> in the older artifacts is stale — **do not recreate or duplicate any applied migration.** New DB
> objects go in a NEW timestamped migration appended to `supabase/migrations/`.
>
> **JWKS/ES256 auth is IMPLEMENTED (commit af9c5d3) — verify, do not rebuild** (`runtime/61`). Deploy non-negotiable: `SUPABASE_JWT_SECRET` must be set (fail-closed, DEC-54).
>
> **REMAINING work only:** (1) backend-completion — the genuinely-missing endpoints in
> `runtime/60-repo-reconciliation.md` §4; (2) two auth-hardening items (aud check, fail-closed config); (3) frontend +
> integration; (4) tests for the new work. Nothing else.

## Non-negotiables

1. **Do not rewrite `consulta_tjsp_lote.py`.** Vendored, frozen. Navigation, page classification,
   layout detection, extraction and recovery stay byte-identical. Changes go in adapters. The only
   sanctioned addition is `submeter_senha()` as a **new function** (DEC-20).
   Why it matters: 94/106 processes, 282 movements, 0 errors, 0 captcha timeouts.
   `eproc_eventos` (51) and `container_movimentacao` (43) both fire in production — collapsing that
   branch breaks ~40% of queries while still looking like a refactor.
2. **No calculated value is ever user-writable.** No column, endpoint, or grant. This is the defect
   that broke the original spreadsheet; the whole design exists to make it unrepresentable.
3. **Materialized == recomputed, always** (TEST-CALC-07), in the same transaction as the fact.
4. **Secrets:** env-var names only. Never log, return, email, audit, or screenshot a password.
   `.env.example` carries names, never values.
5. **Every table gets RLS.** Nothing public.
6. **The three transactional links are atomic** — never an instalment received without its entry.
7. **TJCE/TJBA are out of scope for v1 (DEC-38), and their `pendente_implementacao` behavior IS a v1 deliverable.**
   See `20-tribunal-scope.md`. Reserved slots are real: `TJCE` and `TJBA` are registered as `None`. Processes for them record
   `pendente_implementacao` and the run continues. Gabriel writes those scrapers himself (DEC-15) —
   **do not** implement them, and do not substitute an API.
8. **Implementation gates stay PENDING** until proven.

## Start here (frontend execution)

**FS-1: scaffold the Vite frontend, wire Supabase Auth + the typed FastAPI client, and add `GET /me`.** The backend is the validated baseline (`af9c5d3b`) — verify it runs; do not rebuild it.

The scraper is **already in this package**, under version control:

| | |
|---|---|
| Path | `vendor/scraper/consulta_tjsp_lote.py` |
| SHA-256 | `c9429f2aa3ac05a30fe53075ce56fb2def63e5cc82f229a0531b94ba73701ad8` |
| Fixtures | `vendor/fixtures/html/` (5) + `vendor/fixtures/golden-extraction.json` |

Do **not** search `~/Downloads`. Do **not** choose between copies — that was resolved during
planning and is documented in `vendor/PROVENANCE.md`. Write TEST-SCRAPER-01/02/03 first: they pin
the file hash and the two production layout branches (`eproc_eventos` 51/94, `container_movimentacao`
43/94) against golden output. Until they are green, `GATE-SCRAPER-FROZEN` is unenforceable and "we
didn't change extraction" is a claim rather than a fact.

## Blocking items

**None.** Every decision is resolved; no external file is required to start or finish
implementation.

| ID | External dependency | Effect on you |
|---|---|---|
| EXT-DEP-01 | Supabase project + keys (Gabriel, operator action) | **None for Codex.** The schema is already applied in `supabase/migrations/`; verify it is present and build only the REMAINING work (backend-completion endpoints, JWKS rework, frontend). Never rebuild or duplicate an applied migration. Stop at production apply — do not wait, do not ask. |

The real spreadsheets are **not** needed: Phase 6 is built and completed against synthetic fixtures
generated by `tests/fixtures/planilhas/gerar_sinteticas.py` (see `19-spreadsheet-import-contract.md`).

## Deliverables

- **Backend migrations already applied** in `supabase/migrations/` — verify, never rebuild or duplicate. New DB work = new timestamped migration only.
- RLS policy files, pasteable into Supabase
- Backend: domain services, calculation engine, radar orchestration, API
- Scraper interface + registry with TJSP live and **TJCE/TJBA reserved**
- Test suite in two tiers: the **fixture** tier (no browser, no network) and a **`pytest -m browser`**
  tier for password submission and debug-artifact suppression, which cannot be proven from static HTML
- Final report: files created/changed, DB↔scraper data flow, tables added, endpoints implemented,
  tests run — **without breaking the validated scraper**

## Definition of done

All gates green except `GATE-PROD-RUN`, which requires the production host (EXT-DEP-01). **Phase 6
is not blocked** — it completes against synthetic fixtures.

All **86** requirements carry verification: **85** by automated test, **1** (NFR-12) by the defined
evidence procedure **EVID-01** under `production_like_run_verified`.
**Requirements without verification: 0.**

**Machine-readable artifacts** (what `implement-max` consumes): `18-task-manifest.yaml` (65 tasks
with `phase` + `dependencies`), `26-acceptance-criteria.yaml` (79), `27-requirement-traceability.yaml`,
`vertical-traceability.yaml`. Readable↔canonical ID maps: `TASK-ID-MAP.json`, `TEST-ID-MAP.json`.
Prose IDs (`FR-01`, `T-004`, `TEST-RADAR-01`) and canonical IDs (`FR-001`, `TASK-004`, `TEST-001`)
denote the same things.

## Start command

```
Implement the active system plan using the implement-max skill.
```
