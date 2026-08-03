# 51 — Frontend & Integration Plan (production)

Sistema Integrado Pavageau — production frontend + end-to-end integration with the existing FastAPI
backend and the live Supabase project. Verified preflight: `runtime/50-frontend-preflight.md`.
Decisions: DEC-42…DEC-49.

**Codex builds backend-completion + frontend as vertical slices. No fake data in any production path.**

> **VISUAL AUTHORITY (mandatory): `runtime/63-visual-replacement-directive.md`.** Replace the current
> `frontend/src` presentation with a faithful reproduction of `vendor/frontend/pavageau_v2.jsx`
> (sidebar/header/layout/tables/cards/modals/tokens), one component per view, **preserving** the
> existing `lib/api.js`/`lib/supabase.js` integrations and the approved login/reset screens.

---

## 1. Architecture & stack (DEC-48)

```
frontend/                      # new; Vite root
  src/
    app/                       # providers, router, query client, error boundary
    lib/
      supabase.ts              # @supabase/supabase-js — AUTH ONLY (signIn, session, reset)
      api/
        client.ts             # typed FastAPI client: base VITE_API_URL, attaches Bearer, error mapping
        generated.ts          # types generated from FastAPI OpenAPI (openapi-typescript)
      auth/
        session.ts            # session store, refresh, expiry, logout
        guards.tsx            # <RequireAuth>, <RequireMember>
    features/
      dashboard/ fluxo/ analises/ dre/ balanco/
      contratos/ parcelas/ lancamentos/ custos-fixos/
      tarefas/ radar/ processos/ parametros/ auditoria/
      auth/                    # login, set-password, reset, not-authorized
    components/                # design-system primitives (Table, Card, StatTile, Money, StateBoundary…)
    styles/tokens.css          # design tokens (§7)
    test/                      # unit, hooks, client, msw handlers (DEV/test only)
```

- **`@supabase/supabase-js` is used only for Auth** (login, session, refresh, password reset). It never
  reads or writes domain tables. Every domain read/write goes through the FastAPI client, which forwards
  the Supabase access token so **RLS + `current_user_is_app_member()` still apply**.
- **TanStack Query** owns server cache, loading/error states, invalidation after mutations.
- **react-hook-form + zod** own form state and validation; zod schemas are shared with the API client
  types where possible.
- **Routing**: React Router; a `<RequireAuth>` guard (session present) and a `<RequireMember>` guard
  (backend `GET /me` says `is_member=true`).

## 2. Auth, JWT, session (DEC-44, DEC-46) — backend + frontend

**Flow (single, decided):** sign-up disabled → owner invites the email in Supabase → user sets password
via the invite link → login (Supabase Auth) → access token in `Authorization: Bearer` on every FastAPI
call → FastAPI verifies the token and RLS enforces `current_user_is_app_member()`.

### 2.1 Backend JWT auth — **IMPLEMENTED at commit af9c5d3** (verify, do not rebuild)

`app/db/session.py` validates **ES256/RS256 via JWKS** (cached), checks `exp/nbf/iss/sub/role`, keeps HS256
compat, and returns 401≠403. Two hardening items remain for the `/me` slice (`runtime/61 §2`): add the
`aud` check (J2) and ensure the deployed config makes verification fail-closed (J1 — `SUPABASE_JWT_SECRET`
must be set, or drop the `if jwt_secret:` gate). Original spec, now satisfied:
- **Primary: JWKS.** Fetch the project JWKS from `SUPABASE_JWT_JWKS_URL`, cache keys, refresh on
  unknown `kid` (bounded), verify signature with the asymmetric key.
- Validate `exp`, `nbf`, `iss` (project URL), `aud` (`authenticated`), require `sub`, require
  `role=authenticated`. Reject any unexpected `alg` (no `none`, no downgrade).
- **Fail-closed:** if neither JWKS nor a legacy `SUPABASE_JWT_SECRET` is configured, the API **rejects all
  requests** — never the current "no secret → treat as authenticated" behavior.
- **HS256 legacy** (`SUPABASE_JWT_SECRET`) kept only as an explicit fallback for a legacy project.
- **401 vs 403:** 401 = missing/expired/invalid/forged token or user no longer exists. 403 = valid token
  but not an active `app_member` (authenticated-but-not-authorized).
- `GET /me` (new): returns `{ user_id, email, is_member, papel }` from `app_members` — the single source
  the frontend uses to route to the app vs the "not authorized" screen (avoids inferring from empty RLS
  results).
- The frontend **never** receives `SUPABASE_JWT_SECRET`, the service-role key, or any admin key.

### 2.2 Frontend session
- Supabase session persisted by supabase-js; **auto-refresh** before expiry; on refresh failure → treat as
  expired → route to Login preserving the intended route.
- **401** from the API → clear session, route to Login (session invalid/expired).
- **403** from the API (or `GET /me` → `is_member=false`) → route to **UI-F04 Não autorizado** (not Login).
- **Logout** clears the Supabase session and the query cache.

## 3. Backend-completion endpoints — CORRECTED to genuinely-missing only (`runtime/62`)

**Most CRUD already exists** via `_collection_routes` (parceiros/contratos/lançamentos/custos-fixos/
tarefas/processos) — the frontend consumes it directly; **do not recreate it.** The only missing,
additive endpoints (thin wrappers over existing `PostgresService`/orchestrator, each tied to a screen):

| Endpoint | Wraps | Slice |
|---|---|---|
| `GET /me` | `app_members` self-read | FS-1 |
| `POST /radar/executar` | `orchestrator.executar()` | FS-7 |
| `GET /radar/execucoes` · `/execucoes/{id}` · `/ultima` | `list_rows(execucoes_radar/resultados)` | FS-7 |
| `GET /radar/movimentacoes-novas` | `list_rows(movimentacoes_novas)` | FS-7 |
| `GET /auditoria` | `list_rows(auditoria)` read-only | FS-8 |
| `GET /contratos/{id}` *(recommended)* | `list_rows(contratos, {id})` | FS-3 |

Plus additive query filters on the existing collection GETs. **No refactor, no new domain logic.**
`backend_endpoints_without_consumer_when_required = 0`; no endpoint duplicates a live route.


## 4. Screen inventory & routes

Admin module and role-gating removed (DEC-45/47). Auditoria kept read-only (law-firm value).

| ID | Screen | Route | Priority |
|---|---|---|---|
| UI-F01 | Login | `/login` | must |
| UI-F02 | Definir senha (convite) | `/definir-senha` | must |
| UI-F03 | Redefinir senha | `/redefinir-senha` | must |
| UI-F04 | Autenticado mas não autorizado | `/sem-acesso` | must |
| UI-F10 | Layout + navegação | (shell) | must |
| UI-F11 | Painel / Dashboard | `/` | must |
| UI-F12 | Fluxo de caixa | `/fluxo` | must |
| UI-F13 | Análises do mês | `/analises` | must |
| UI-F14 | DRE | `/dre` | must |
| UI-F15 | Balanço e projeções | `/balanco` | must |
| UI-F16 | Contratos (lista) | `/contratos` | must |
| UI-F17 | Detalhe do contrato + parcelas | `/contratos/:id` | must |
| UI-F18 | Parcelas (a receber / inadimplência) | `/parcelas` | must |
| UI-F19 | Lançamentos | `/lancamentos` | must |
| UI-F20 | Custos fixos | `/custos-fixos` | must |
| UI-F21 | Tarefas | `/tarefas` | must |
| UI-F22 | Radar de processos | `/radar` | must |
| UI-F23 | Detalhe do processo | `/radar/:id` | must |
| UI-F24 | Histórico de execuções / movimentações | `/radar/execucoes` | must |
| UI-F25 | Parâmetros e configurações | `/config` | must |
| UI-F26 | Auditoria (somente leitura) | `/auditoria` | should |
| UI-F00 | Estados globais (erro/sessão/indisponibilidade) | (overlay) | must |

Detailed per-surface contracts with **every state** are in `52-frontend-contracts.md`.

## 5. Calculated values are read-only (product rule, brief §9)

`painel`, `fluxo-caixa`, `dre`, `balanco`, `analises/mes` come from the materialized `ind_*` tables and
are **never** rendered as editable fields. Each read surface shows: the value, its **period**, its
`recalculado_em` (freshness), a tooltip explaining origin, and refreshes automatically (query
invalidation) after any financial mutation. States: loading · unavailable (API/DB down) · empty (no data
for period) · stale (recalculado_em older than the last mutation → show "atualizando"). A dedicated
component `<CalculatedValue>` renders these and has **no editable variant** — enforced by the anti-fake
validator (§8).

## 6. Frontend→FastAPI client (brief §11)

Central `api/client.ts`: reads `VITE_API_URL`; attaches the Bearer token; refreshes on expiry; maps
**401**→session-expired, **403**→not-authorized, **404**→not-found state, **409**→idempotency/business
conflict (surfaced with the endpoint's message), **422**→field-level validation, **429**→backoff+retry,
**5xx/offline**→non-destructive error keeping local state; logs correlation id when present; never leaks
internals. Types come from the FastAPI **OpenAPI** via `openapi-typescript` (`generated.ts`) so the client
is typed against the real contract.

## 7. Design tokens (from the vendored reference)

Navy palette (`--navy:#1E2A56`, `--navy-deep:#151D3E`, `--navy-soft:#2C3B6E`), gold as **accent only**;
card padding 13–17px; table rows 35–40px; card text 13–17px; radii ~2px; no big shadows, no decorative
gradients, no oversized rounding, no empty filler, dense-but-organized. The full token set is emitted to
`frontend/design-tokens.yaml` and `src/styles/tokens.css` from `FRONTEND_REFERENCE_PAVAGEAU.md`. The
"contraste entre dado digitado e dado calculado" from the reference maps directly to `<CalculatedValue>`
vs editable inputs.

## 8. No fake data in production (brief §12) — enforced, not promised

Mocks allowed only in tests / Storybook / MSW dev handlers, never in the production build. A CI check
(`scripts/check_no_mocks.mjs`, task-owned) fails the build on: static arrays standing in for an endpoint,
hardcoded/fake login or token, handlers with no API call, buttons with no `onClick`/action, MSW imported
outside `test`/dev, or any `<CalculatedValue>` bound to a literal. This is the machine backing for
`production_mock_paths = 0`.

## 9. Environments (brief §14)

Frontend: `VITE_SUPABASE_URL`, **`VITE_SUPABASE_ANON_KEY`** (the project's current key; `VITE_SUPABASE_PUBLISHABLE_KEY` only after a future rotation), `VITE_API_URL`. Backend: `SUPABASE_URL`,
`SUPABASE_JWT_JWKS_URL` (primary), `SUPABASE_JWT_SECRET` (legacy fallback only), `DATABASE_URL`, **`MIGRATION_DATABASE_URL`** (migrations), `CORS_ALLOWED_ORIGINS`, `SUPABASE_ALLOWED_EMAILS` (API-layer allowlist; RLS/`app_members` authoritative). `SUPABASE_JWT_JWKS_URL` is set when the JWKS rework lands (DEC-44). Environments: local · Supabase remote dev · staging · production, each with its own
Auth redirect URLs and CORS origins. `.env.example` lists names only. Deploy: frontend to a static host
(Vercel/Netlify/Cloudflare Pages); API container alongside the radar worker. Health checks, logs, rollback
per environment.

## 10. Vertical-slice decomposition (brief §16) — each slice: backend + endpoint + db + frontend + test + evidence

| Slice | Contents |
|---|---|
| FS-1 Fundação + Auth | Vite app, design system/tokens, Supabase Auth (login/set-password/reset), **JWKS backend rework**, `GET /me`, guards, api client, error boundary, not-authorized state. Tests: auth (válido/expirado/adulterado/não-membro), rotas protegidas, 401≠403. |
| FS-2 Painel | `GET /painel` + `<CalculatedValue>`; dashboard real. Read-only invariants tested. |
| FS-3 Contratos & Parcelas | `/parceiros` GET, `/contratos` CRUD, `/contratos/{id}`, parcelas confirmar/estornar; contract list + detail + parcelas UI. |
| FS-4 Lançamentos & Fluxo | `/lancamentos` CRUD (+ quitação de parcela), `/custos-fixos` CRUD + `/lancar`; fluxo-caixa read. |
| FS-5 Análises & Indicadores | `/analises/mes`, `/dre`, `/balanco`; read-only surfaces with freshness. |
| FS-6 Tarefas | `/tarefas` CRUD + concluir; criar-tarefa por movimentação. |
| FS-7 Radar & Processos | `/processos` CRUD, `/radar/executar`, `/radar/execucoes`, `/ultima`, `/movimentacoes-novas`; radar list/detail/history; TJCE/TJBA "aguardando scraper" (neutro), "exige senha" → cadastrar senha. |
| FS-8 Config & Auditoria | `/parametros`, `/configuracoes`, read-only auditoria. |
| FS-9 Integração final + E2E + validação visual | full suite, screenshots, no-mock validator, no backend regression. |

## 11. Tests (brief §13) — during slices, then full suite

Per slice: unit, component, hooks, api-client, session, protected-route, validation, OpenAPI-contract,
integration (frontend↔FastAPI), Supabase-Auth, **RLS+allowlist**, then E2E + responsiveness + a11y +
console/failed-request inspection + visual + screenshots. Mandatory cases (brief §13): login válido/senha
incorreta/sessão expirada; autenticado **em** e **fora** de `app_members`; usuário removido durante a
sessão; rota sem auth; sem permissão; banco/API indisponível; 409; 422; tabela vazia; carregamento lento;
atualização após mutação; persistência após reload.

## 12. Deliverables (brief §15)

Executable frontend; design system + tokens; all routes/screens; Supabase Auth integration; typed FastAPI
client; forms+validation; loading/empty/error/success states; responsiveness; a11y; tests; E2E; visual
evidence (screenshots of every must screen); `.env.example`; run docs; deploy docs; final report; **the
backend-completion endpoints**; **no backend regression**; **no production mock path**.
