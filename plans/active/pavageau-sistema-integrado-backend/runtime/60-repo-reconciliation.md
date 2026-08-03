# 60 — Repository Reconciliation (plan_audit, 2026-07-21)

Audits plan **v3.0.0** against the repo at commit **`7be04107f05513d784d62e4089a3e15faf7ac83e`**
("Prepare Supabase backend for frontend integration"). Verified against files on disk, not the brief.

**This document supersedes the migration-numbering and backend-to-build language in the older
artifacts.** Where an older artifact says "build migrations `000`–`011`", read it as **"the backend is
already implemented; verify, do not rebuild"** (§2).

---

## 1. What is now IMPLEMENTED and applied (do NOT re-plan; PRESERVE)

Backend **Phases 0–6 are done and applied to Supabase.** Evidence on disk:

| Area | Evidence | Plan tasks now DONE (verify-only) |
|---|---|---|
| Schema, enums, RLS, indices, SECURITY DEFINER fns | `supabase/migrations/` (5 files, latest 07-21) | Phase 1 (T-009…T-019), Phase 2 (T-020…T-026) |
| `app_members` allowlist + `current_user_is_app_member()` | `20260720212612_backend_schema_rls_auth_ready.sql` | — |
| **RLS hardening + advisor findings** | `20260721211551_harden_rls_and_advisor_findings.sql` (`private` schema; radar_worker creds out-of-band) | — |
| `recalcular_mes` lint fix | `20260721212402_fix_recalcular_mes_lint.sql` | T-025 |
| `radar_worker` role (login, grants, policies) | in the 07-20 + 07-21 migrations | T-019 |
| Domain services, calc engine, radar, loader | `app/domain`, `app/reports`(*), `app/radar`, `app/loader` | Phases 3–6 backend halves, T-069…T-074 |
| 19 API endpoints (reads + parcelas ops + custos `/lancar` + criar-tarefa + senha + parametros + configuracoes) | `app/api/main.py` | the endpoints listed |
| **Scraper TJSP — FROZEN, hash intact** | `radar/scrapers/vendor/consulta_tjsp_lote.py` = `c9429f2a…` ✅ | T-001, T-004 |
| 15 backend test files (api/calc/config/loader/radar) | `tests/` | Phase-5 backend tests |

The brief asserts the backend suite passes; I confirmed the test files exist and the schema is applied.
I did **not** re-run the full suite (it needs the remote DB credentials, which are in `.env` — not read
per secret policy). This is a stated non-verification, not a claim.

## 2. Migration source of truth — CORRECTED

- **`supabase/migrations/` (timestamped) is the SOLE official source.** The legacy `migrations/000–011`
  directory is **REMOVED** (confirmed: `ls migrations/` → absent). `database/migrations/` holds only a README.
- **Every plan reference to `000_bootstrap.sql … 011_watchdog.sql`, `010_radar_role.sql`, "rebuild from
  zero 000–010", and "migrations 000–011" is STALE.** Those objects are already applied. Codex must:
  - **NOT** recreate or duplicate any applied migration.
  - Put any *new* DB object (e.g. an `app_members` admin helper, if ever) in a **new timestamped
    migration** appended to `supabase/migrations/`.
  - Treat "rebuild from zero" as a local-dev convenience only, run from `supabase/migrations/`.

## 3. Env reality — CORRECTED (names only; no values read)

`.env.example` (current) names, reconciled against the plan:

| Var | Status vs plan |
|---|---|
| `MIGRATION_DATABASE_URL` | **NEW — add to plan.** Used by `app/db/migrate.py` (falls back to `DATABASE_URL`). |
| `DATABASE_URL`, `RADAR_DB_URL` | present, as planned; work against the remote |
| `SUPABASE_ALLOWED_EMAILS` | **NEW — a second, API-layer allowlist alongside `app_members`.** See FINDING-C. |
| `SUPABASE_JWT_SECRET` | present (HS256). **No `SUPABASE_JWT_JWKS_URL`** → JWKS **not yet configured** (FINDING-A). |
| `VITE_SUPABASE_ANON_KEY` | the project uses the **legacy anon key**, not `VITE_SUPABASE_PUBLISHABLE_KEY`. Plan must treat `ANON_KEY` as the current frontend var. |
| `SUPABASE_TEST_EMAIL/PASSWORD/ACCESS_TOKEN` | present → real auth-integration test fixtures exist |

## 4. What is STILL genuinely missing (valid REMAINING work — no over-planning)

Verified against the authoritative `@app.*` route list (19 routes). Backend-completion = **only** these,
each genuinely absent today:

- `GET /me`
- `/parceiros` (list + CRUD), `/contratos` (list, detail, POST, PATCH, DELETE — only nested
  `GET /contratos/{id}/parcelas` exists today), `/lancamentos` (CRUD), `/custos-fixos` (list + CRUD —
  only `/lancar` exists), `/tarefas` (CRUD), `/processos` (list, create, delete — only `PUT …/senha`
  exists), `/radar/executar|execucoes|execucoes/{id}|ultima|movimentacoes-novas`, `/auditoria` (read).
- **JWKS auth rework** — `app/db/session.py` still base64-decodes claims and verifies HS256 only, and
  **fails open when no secret is set**. Not done. Remains valid REMAINING work (FINDING-A).
- **Frontend** — not built.

`backend_endpoints_without_consumer_when_required = 0` still holds (each is consumed by a screen in
`52` §4). **No backend-completion endpoint duplicates an existing route.**

## 5. Findings

### FINDING-A (RESOLVED at commit af9c5d3) — JWKS/ES256 now implemented

> **Update:** implemented in `app/db/session.py` (see `runtime/61-audit-af9c5d3.md`). Two residual
> hardening items (J1 fail-open gating, J2 aud) tracked there. Original finding, for the record:
`app/db/session.py::parse_jwt_claims` is unchanged since v3.0.0: no `SUPABASE_JWT_JWKS_URL` in env, no
JWKS verification. The plan's DEC-44 (JWKS, fail-closed) remains correct **as remaining work**, not as
done. Keep it in the frontend-phase scope (TASK for `T-BE-2`). This is not a regression — it was never done.

### FINDING-B (MINOR) — the plan's `frontend/screen-contracts`/`51` env assumed `VITE_SUPABASE_PUBLISHABLE_KEY`
Reality: the project ships `VITE_SUPABASE_ANON_KEY`. Repaired: the frontend uses `VITE_SUPABASE_ANON_KEY`
as the current key; `PUBLISHABLE_KEY` is only for a future key rotation.

### FINDING-C (MAJOR — verify) — two allowlist mechanisms coexist
`app_members` (DB RLS, the brief's mandatory contract) **and** `SUPABASE_ALLOWED_EMAILS` (API-layer env).
The brief fixes "Supabase Auth → JWT → FastAPI → RLS → dados" as the mandatory contract, so **`app_members`
via RLS is authoritative**. `SUPABASE_ALLOWED_EMAILS` is an additional API-layer gate. The plan records
both; the frontend's `GET /me`/authorization must reflect the **effective** decision (a user is authorized
only if allowed by *both*, if both are enforced). Codex must read the actual API auth code and match it —
this is captured as a REMAINING backend-completion clarification, not a new user question.

### FINDING-D (resolved) — preflight claims are now stale in a good way
`runtime/50-frontend-preflight.md` said the real schema was `20260720212612`. Two more migrations were
applied on 07-21 (RLS hardening, recalcular fix). Updated. The core preflight conclusions (app_members
model, missing endpoints, HS256) **still hold** — the 07-21 migrations hardened, they did not change the
data model or add the missing endpoints.

### FINDING-E (CRITICAL for the brief) — the plan re-plans completed backend work
Phases 0–6 (T-001…T-074) are written as "to build". They are **done and applied**. Repaired by §1/§2 and
the handoff's new "backend is implemented — preserve, do not regress" non-negotiable, plus the explicit
DONE/REMAINING task boundary (§1 table). Codex's Phase-0–6 action is **verify present**, not rebuild.

## 6. Preserved invariants (unchanged, confirmed)
Scraper hash `c9429f2a…` intact · region `sa-east-1` · spreadsheets not required (synthetic fixtures) ·
TJCE/TJBA out of v1 (`pendente_implementacao`) · three runtime identities · materialized values read-only.

## 7. Ready conditions (brief) — status
- synced to commit `7be04107` — **YES** (HEAD == target).
- no completed task re-planned — **repaired** (§1/§5-E; DONE/REMAINING boundary).
- Codex preserves existing backend — **enforced** (handoff non-negotiable; §2 migration rule).
- backend-completion = only genuinely-missing endpoints — **YES** (§4, verified vs 19 routes).
- frontend/Auth/API/DB linked by real contracts — **YES** (`52` matrix; RLS+JWT contract mandatory).
- `codex_questions_required` = 0 — **YES** (FINDING-C resolved as a code-read task, not a user question).
