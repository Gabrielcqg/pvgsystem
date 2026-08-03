# 50 — Frontend Preflight (verified against the actual repo, 2026-07-20)

> **UPDATE (2026-07-21, plan_audit):** the migration facts below are refined by
> `runtime/60-repo-reconciliation.md`. `supabase/migrations/` now holds **5** timestamped files (two
> added 07-21: RLS hardening + a recalcular_mes lint fix); the legacy `migrations/000-011` dir is
> **removed**. The core conclusions here (app_members model, missing endpoints, HS256 fail-open) still
> hold. Where this doc numbers migrations, defer to `60-repo-reconciliation.md`.

Every claim below was checked against files on disk, not against the brief.

## A. Source of truth for the DB moved — and the brief is right that `app_members` exists

- The `migrations/000–011` folder is the **old plan-generated set**. The **real applied schema** is
  `supabase/migrations/20260720212612_backend_schema_rls_auth_ready.sql` (42 KB, today).
- `public.app_members` **exists**: columns `email`, `papel text check (papel in ('admin','membro')) default 'admin'`, `ativo`. Seeded with `gacamargo2003@gmail.com` as `admin`.
- `public.current_user_is_app_member()` (SECURITY DEFINER) checks `ativo AND lower(email)=lower(auth.jwt()->>'email')`.
- **Every** RLS policy now gates on `current_user_is_app_member()`. So an authenticated user **not** in
  `app_members` (or inactive) can read/write **nothing** — the "authenticated-but-not-authorized" state
  is already enforced at the DB. Roles `admin`/`membro` already exist in the schema.
- `app_members_self_read`: a user may read only their own row.

**Consequence:** the allowlist/authorization model is **already decided by the live schema** (app_members
+ membership function + roles). I do not re-invent it; I plan the frontend and the missing pieces on top
of it. The `emails_autorizados`+trigger I sketched earlier is superseded by what you actually built.

## B. The FastAPI surface is materially incomplete for a full frontend

Definitive endpoint list (all 20 `@app.*` routes in `app/api/main.py` — there are no routers):
health · `GET /contratos/{id}/parcelas` · parcelas POST/PATCH/DELETE/confirmar/estornar ·
`POST /custos-fixos/{id}/lancar` · `POST /movimentacoes/{id}/criar-tarefa` · `PUT /processos/{id}/senha` ·
parametros GET/PUT · configuracoes GET/PUT · painel · fluxo-caixa · dre · balanco · analises/mes.

**Missing endpoints the required screens need (do NOT exist):**

| Recurso | Falta |
|---|---|
| parceiros | GET list (+ CRUD) |
| contratos | GET list, GET detail, POST, PATCH, DELETE |
| lancamentos | GET list (filtros), POST, PATCH, DELETE |
| custos-fixos | GET list, POST, PATCH, DELETE (só existe `/lancar`) |
| tarefas | GET list, POST, PATCH (concluir), DELETE |
| processos | GET list, POST, DELETE (só existe PUT senha) |
| radar | `POST /radar/executar`, `GET /radar/execucoes`, `/execucoes/{id}`, `/ultima`, `/movimentacoes-novas` |
| app_members | admin endpoints (se admin UI entrar no escopo) |

The backend API plan (`13-api-contract-plan.md`) specified all of these; the delivered API implemented a
subset. So this frontend plan **must carry a backend-completion track** — exactly what the brief's §2/§8
anticipate ("planeje o contrato backend correspondente"). **Resolved autonomously: included.**

## C. JWT validation is HS256-only AND fails OPEN by default — must be reworked

`app/db/session.py::parse_jwt_claims`: if `SUPABASE_JWT_SECRET` is **unset**, a token that isn't 3 parts
returns `{"sub": None, "role": "authenticated"}` — i.e. **the API treats malformed/forged tokens as an
authenticated user**. With the secret set, it verifies HS256 only. The brief requires JWKS for asymmetric
keys (modern Supabase default), fail-closed, and 401≠403. **Resolved autonomously: the plan includes a
JWKS-based, fail-closed auth rework; HS256 kept only as an explicit legacy fallback.**

## D. Reference files — relocated

- Authoritative visual contract: `plans/active/pavageau-sistema-integrado-backend/vendor/frontend/FRONTEND_REFERENCE_PAVAGEAU.md` (2080 lines) + `pavageau_v2.jsx`.
- Template scaffold present: `system-building-os/templates/project-reference/frontend/` (`FRONTEND_REFERENCE.md`, `design-tokens.yaml`, `screen-inventory.yaml` — the inventory is an empty stub, so the screen set is derived from the product plan). **Resolved autonomously: vendored reference is authoritative.**

## E. Resolved autonomously (documented, not asked)

| # | Decision |
|---|---|
| Backend completion | Included in this plan as vertical slices (B). |
| JWT auth | JWKS + fail-closed, HS256 legacy-only (C). |
| Reference | Vendored `FRONTEND_REFERENCE_PAVAGEAU.md` is authoritative; `.md` beats `.jsx` (D). |
| Stack | React + TypeScript + Vite + TanStack Query + React Router + react-hook-form + zod + `@supabase/supabase-js` (Auth only) + a typed FastAPI client generated from OpenAPI. |
| Frontend↔domain rule | Supabase client used **only** for Auth; all domain reads/writes go through FastAPI (RLS still applies via the forwarded JWT). |
| Deploy default | Frontend static host (Vercel/Netlify/Cloudflare Pages); API container on the same host family as the radar worker. Finalized at provisioning; not a contract blocker. |

## F. Genuinely material — must ask (one grouped round)

1. Scope of user administration in v1 (full admin module vs minimal, given "único usuário por enquanto").
2. How a member gets their account + password recovery (invite vs self-signup-with-gate vs login-only).
3. Whether the `admin`/`membro` roles already in the schema drive the v1 UI, or everyone is treated as admin for now.
