# 62 — Frontend-Focused Execution Scope (plan_audit, 2026-07-21)

Backend baseline = commit **`af9c5d3b`** — **validated, preserved, NOT rebuilt.** This document is the
authoritative execution scope: **frontend + a tiny, additive set of genuinely-missing endpoints.**

## 1. Backend baseline — DONE, do not touch

Everything below is implemented and applied. Codex **verifies, never rebuilds or refactors**:

- Schema, RLS, `app_members` + `current_user_is_app_member()`, `radar_worker`, SECURITY DEFINER fns —
  `supabase/migrations/` (5 files, sole source; legacy dir removed).
- **Auth ES256/JWKS + HS256 compat** (`app/db/session.py`), 401≠403 — done at `af9c5d3` (`runtime/61`).
- Domain/calc/radar/loader (`app/domain`, `app/reports`, `app/radar`, `app/loader`); `PostgresService`
  with `list_rows/create/patch/delete` + domain ops (`confirmar_parcela`, `estornar_parcela`,
  `lancar_custo_fixo`, `criar_tarefa_de_movimentacao`, `registrar_senha_processo`).
- **Generic CRUD is already wired** via `_collection_routes(path, table)` in `app/api/main.py`, registered
  for **`/parceiros`, `/contratos`, `/lancamentos`, `/custos-fixos`, `/tarefas`, `/processos`** — each
  gives `GET`(list) · `POST` · `PATCH /{id}` · `DELETE /{id}`. Plus the literal routes (parcelas ops,
  `/custos-fixos/{id}/lancar`, `/movimentacoes/{id}/criar-tarefa`, `/processos/{id}/senha`, parametros,
  configuracoes, the read reports, `/contratos/{id}/parcelas`).
- Scraper frozen (`c9429f2a…`); 46 tests pass; Docker API working.

> **CORRECTION to earlier plan artifacts.** `runtime/60 §4` and `51 §3` listed full CRUD for
> parceiros/contratos/lançamentos/custos-fixos/tarefas/processos as "missing (N)". **That is wrong — they
> already exist via `_collection_routes`.** Recreating them would duplicate/refactor the backend, which
> the brief forbids. The corrected missing set is §2. Those artifacts' matrices are superseded here.

## 2. Genuinely-missing endpoints (the ONLY permitted backend changes — small, additive, tested)

Verified against the full route set (literal + `_collection_routes`). Each is a **thin wrapper over an
existing service/orchestrator** — **no new domain logic, no refactor.** Each is consumed by a defined
frontend interaction.

| Endpoint | What it wraps (existing) | Frontend interaction | Slice |
|---|---|---|---|
| `GET /me` | read `app_members` by `auth.jwt()->>email` (RLS `app_members_self_read`) | IX-005 membership → UI-004/routing | FS-1 |
| `POST /radar/executar` | `app/radar/orchestrator.executar()` (advisory lock, 409 already handled) | IX-015 executar radar (UI-017) | FS-7 |
| `GET /radar/execucoes` | `service.list_rows("execucoes_radar", …)` | UI-019 history | FS-7 |
| `GET /radar/execucoes/{id}` | `list_rows` execucao + `resultados_consulta` filtered | UI-019/UI-018 | FS-7 |
| `GET /radar/ultima` | `list_rows("execucoes_radar", order desc, limit 1)` | UI-017 radar panel | FS-7 |
| `GET /radar/movimentacoes-novas?execucao_id=` | `list_rows("movimentacoes_novas", filters)` | IX-024 curation (UI-019) | FS-7 |
| `GET /auditoria` | `list_rows("auditoria", …)` (read-only; insert-only trail) | UI-021 auditoria | FS-8 |
| `GET /contratos/{id}` *(recommended)* | `list_rows("contratos", filters={id})[0]` | UI-012 detalhe | FS-3 |

**Additive niceties allowed within the same slices** (still no refactor): pass-through query **filters**
on the existing collection `GET` routes (e.g. `/lancamentos?mes&tipo&categoria&pago`,
`/tarefas?status&origem`, `/processos?tribunal`) by extending `list_rows`' existing `filters` kwarg;
CNJ 422 on `POST /processos` if not already enforced. Nothing else in the backend is touched.

Auth hardening from `runtime/61` (add `aud` check J2; ensure fail-closed config J1) rides on the `/me`
slice — additive to `app/db/session.py`, no rewrite.

## 3. Execution scope (what Codex builds)

| Set | Tasks | Action |
|---|---|---|
| **Frontend** | T-FE-01 … T-FE-09 | **BUILD** — the full frontend from the reference, all screens/states, real API integration, tests + E2E |
| **Additive endpoints** | **T-BE-1 (re-scoped to §2 only)** | **BUILD small/additive** — thin wrappers over existing services; per-slice with the screen that consumes them |
| **Everything else (backend Phases 0-6, auth JWKS T-BE-2, CRUD factory)** | all VERIFY-PRESENT tasks | **DONE — verify present, do not rebuild/refactor** |

## 4. Non-negotiables for this execution

1. **Preserve the backend baseline** (schema, migrations, RLS, `app_members`, `radar_worker`, radar,
   scraper, ES256/JWKS auth). No refactor, no recreate, no migration duplication.
2. **Backend changes only for §2** — thin, additive wrappers over existing `PostgresService`/orchestrator,
   each tied to a frontend interaction, each with a test. Do **not** re-implement the CRUD that already
   exists via `_collection_routes`.
3. **Frontend** integrates real Supabase Auth + real FastAPI; no fake data in the production build.
4. Migration source = `supabase/migrations/` only; any new DB object (none expected) = new timestamped
   migration.
5. `codex_questions_required = 0`.

## 5. Ready-conditions (brief)
- Frontend-focused scope — **YES** (§3).
- Backend baseline preserved, not rebuilt — **YES** (§1, §4).
- Backend changes only genuinely-missing, small, additive, tested — **YES** (§2: 7 wrappers).
- Delivered backend tasks marked done — **YES** (verify-present; T-BE-2 done).
- `codex_questions_required` = 0 — **YES** (§2/§4 are code-scoped, no user decision).
