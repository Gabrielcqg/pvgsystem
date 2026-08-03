# 63 — Visual Replacement Directive (authoritative for the frontend build)

The built `frontend/` looks nothing like the reference. **Replace the presentation layer of the
authenticated app with a faithful reproduction of `vendor/frontend/pavageau_v2.jsx`, preserving every
existing integration.** This directive is MANDATORY and overrides any looser "inspiration" language.

## 0. The one rule

```
frontend/src/App.jsx (2235-line giant, generic look)  → REPLACE the presentation
frontend/src/lib/*  (api.js, supabase.js, config.js)  → PRESERVE and reuse verbatim
pavageau_v2.jsx (structure + visuals)                 → REPRODUCE faithfully, componentized
```

Swap the **visual layer**, not the functional logic. Do not keep old visual components for
convenience. Do not re-concentrate the app in one giant component.

## 1. Reference authority — `pavageau_v2.jsx` is MUST_FOLLOW (structural + visual)

Not just colors. It dictates: sidebar, header, page structure, visual hierarchy, tables, cards,
charts, filters, spacing, typography, density, icons, modals, forms, interaction states. The result
must be **visually very close** to it, never a generic SaaS dashboard.

### 1.1 Design tokens (exact, from the reference `C`/`S` objects → `src/styles/tokens.css`)
```
navy #1E2A56 · navyDeep #151D3E · navySoft #2C3B6E · navyLine #33417A
gold #C9A24D · goldSoft #E6D2A0 · goldPale #FDF7E8
paper #F5F6FA · line #E3E6EE · ink #1E2A56 · inkSoft #79829C
status: Proposta=inkSoft · Ativo=navy · "Aguardando êxito"=amber · Encerrado=green · "Sem êxito"=red
focus ring: 2px solid gold, offset -1px · buttons: btnSolid (navy) / btnGhost · radii ~2px
```
`design-tokens.yaml` is updated to these exact values.

### 1.2 Layout shell (reproduce precisely)
- **Sidebar** — 200px, `navyDeep` background, sticky full-height. Brand block: `PAVAGEAU` (display
  font, 19px, `.06em`) + gold `SISTEMA INTEGRADO` (8.5px, `.2em`). NAV **groups** with 8px gold
  group labels; active item = `navySoft` bg + **2px gold left border**, inactive `#A9B2CC`. Footer
  status dot (green) block.
- **Header** — white, sticky, bottom border: gold period label (e.g. `JULHO DE 2026`), page title
  (display font, 23px), right-aligned action buttons (`+ Contrato`, `+ Entrada / Saída` → open modals).
- **Content** — the active view component.

### 1.3 Navigation groups (exact, from the reference `NAV`)
`PAINEL` → Painel · Importação · `CONTRATOS` → Contratos · Parcelas · Parceiros ·
`RADAR` → Radar processual · `FINANCEIRO` → Lançamentos · Custos fixos · Fluxo de caixa · DRE ·
Balanço · `OPERAÇÃO` → Tarefas · Ajustes.

## 2. Componentization (the reference is ALREADY componentized — mirror it 1:1)

The reference exposes one component per view. Reproduce that structure under
`src/features/<view>/` — never one blob:

| Reference component | New feature module | Real data source |
|---|---|---|
| `<Painel>` | `features/painel` | `GET /painel` (read-only `<CalculatedValue>`) |
| `<Contratos>` | `features/contratos` | `GET /contratos` (existing CRUD) |
| `<Parcelas>` | `features/parcelas` | `GET /contratos/{id}/parcelas`; confirmar/estornar |
| `<Parceiros>` | `features/parceiros` | `GET /parceiros` (existing CRUD) |
| `<Lancamentos>` | `features/lancamentos` | `GET /lancamentos` (existing CRUD) |
| `<Fixos>` | `features/custos-fixos` | `GET /custos-fixos` + `/lancar` |
| `<Fluxo>` | `features/fluxo` | `GET /fluxo-caixa` (read-only) |
| `<DRE>` | `features/dre` | `GET /dre` (read-only) |
| `<Balanco>` | `features/balanco` | `GET /balanco` (read-only) |
| `<Radar>` | `features/radar` | `GET /processos`, `POST /radar/executar`, `GET /radar/*` |
| `<Tarefas>` | `features/tarefas` | `GET /tarefas` (existing CRUD) |
| `<Ajustes>` | `features/config` | `GET/PUT /parametros/{ano}`, `/configuracoes` |
| `<Importacao>` | `features/importacao` | import_log (read) / hide if no endpoint |

Shared primitives extracted from the reference into `src/components/` (Sidebar, Header, DataTable,
Card, StatTile, Money, Modal, StatusBadge, `<CalculatedValue>`, StateBoundary). Layout/pages/
components/hooks/services stay **separated**.

## 3. Preserve exactly (do NOT rewrite or regress)

- `frontend/src/lib/api.js` — the typed FastAPI client (Bearer token, error mapping). Reuse verbatim.
- `frontend/src/lib/supabase.js` — Supabase Auth (`createClient`, session, refresh). Reuse verbatim.
- `frontend/src/lib/config.js` — env (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
  `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_API_URL`).
- **Login, esqueci-a-senha, redefinição** screens — **approved; do not delete or regress.** The
  replacement happens in the authenticated app after login.
- Session/JWT handling, route guards (`<RequireAuth>`/`<RequireMember>` via `GET /me`).
- Endpoint names/contracts — unchanged. Filters, mutations, business rules — unchanged.
- Existing tests (`test/api.test.jsx`, `test/components.test.jsx`) — keep green (adapt selectors to
  the new components, do not delete coverage).

## 4. Reference local-logic → real API (connect the reference's fake data to real endpoints)

The reference runs on local `db` (`importado()`) and `m` (`useMemo`). **Every fake source becomes the
real API equivalent; no static data in the production build.**

| Reference (local) | Real API (preserve the existing call) |
|---|---|
| `db.*` seed data | the resource `GET` endpoints via `lib/api.js` + TanStack Query |
| `m` computed metrics (`useMemo`) | `GET /painel`, `/dre`, `/balanco`, `/analises/mes` — **read-only** `<CalculatedValue>` |
| `receberParcela` | `POST /parcelas/{id}/confirmar` |
| `estornarParcela` | `POST /parcelas/{id}/estornar` |
| `addLancamento` | `POST /lancamentos` (optional `parcela_id`) |
| `lancarFixo` | `POST /custos-fixos/{id}/lancar` |
| `fecharContrato` | `PATCH /contratos/{id}` (status) |
| `enviarParaTarefas` | `POST /movimentacoes/{id}/criar-tarefa` |
| `rodarVerificacao` | `POST /radar/executar` |

Calculated values (`m`, painel/dre/balanço) are **read-only** — never editable fields (product rule).

## 5. Backend untouched
Do not change backend, DB, migrations, RLS, radar, scraper, or auth. The only permitted backend work
remains the tiny additive endpoints of `runtime/62 §2` (`/me`, `/radar/*`, `/auditoria`,
`/contratos/{id}`) — needed for views that have no endpoint yet.

## 6. Mandatory validation (per the request)
Real login · session load · every protected route · painel · contratos · parcelas · lançamentos ·
fluxo · análises · DRE · balanço · custos fixos · tarefas · radar · processos · config · auditoria ·
real FastAPI calls · **no production mocks** · responsiveness · a11y · **console clean** · `vite build` ·
**Vitest** · **Playwright** · **backend regression = none**. Plus a **browser visual comparison of each
screen against `pavageau_v2.jsx`** with **screenshots of the main pages**. Not done while the
authenticated app still looks like the current frontend.
