# 52 — Screen, Component & Interaction Contracts + F↔B↔DB Matrix

Companion to `51-frontend-plan.md`. Every surface has every state; every action has an interaction
contract bound to a real endpoint. No dead buttons, no fake data.

---

## 0. Shared state model (applied to every screen unless overridden)

Every data surface implements this via `<StateBoundary>`:

- **loading** — skeleton matching the final layout (no spinner-only).
- **empty** — data loaded, zero rows: explains what to create and the primary action.
- **partial** — some sections loaded, others still fetching (independent queries).
- **error** — API/network error: message, retry, **local state preserved** (never blanks the screen).
- **success** — normal render.
- **unavailable** — API/DB down (5xx/offline): banner + retry, read surfaces keep last good data.
- **permission_denied (403)** — routes to UI-F04 (not-authorized), never a blank table.
- **session_expired (401)** — routes to Login preserving intended route.
- **stale** (read/calculated only) — `recalculado_em` older than last mutation → "atualizando" badge.

Responsive rule (desktop-first, brief §6): dense tables collapse to stacked cards below `md`; filters
move into a drawer; primary actions stay visible (never hidden in an overflow menu on mobile);
`recalculado_em` and key totals stay visible.

---

## 1. Screen contracts (UI-###)

Format per the brief; shared states above are assumed and only deviations are noted.

### UI-F01 Login · `/login` · roles: public
purpose: authenticate an existing member. data: none (Supabase Auth). actions: **IX-A01 login**,
link→UI-F03. validation: email format, password required. states: error maps Supabase auth errors
(invalid credentials → field error; rate-limited → 429 message). success → `GET /me`; if
`is_member=false` → UI-F04, else → UI-F11. a11y: labeled inputs, error announced. tests: TEST-FE-AUTH-*.

### UI-F02 Definir senha · `/definir-senha` · roles: invited (recovery token in URL)
purpose: set password from the Supabase invite link. actions: **IX-A02 set-password**. validation:
password policy; token presence. error: expired/used token → explain, offer resend request (owner). success
→ login. 

### UI-F03 Redefinir senha · `/redefinir-senha`
purpose: request reset email + set new password. actions: **IX-A03 request-reset**, **IX-A02** on return.
success: neutral confirmation (don't reveal whether the email exists).

### UI-F04 Não autorizado · `/sem-acesso` · roles: authenticated, non-member
purpose: authenticated but not in `app_members`. content: explains access is restricted; shows the signed-in
email; **logout** action (IX-A04). No app data is fetched here. This is the 403 destination.

### UI-F10 Layout + navegação (shell)
sidebar/topbar navigation to all modules; active-route highlight; the signed-in email + logout; global
period selector (mês/ano) that **persists across screens** (URL query + store); unsaved-work guard on forms
(confirm before navigating away). Radar/Tarefas nav items show a count badge (pending curation / open tasks).

### UI-F11 Painel · `/`
purpose: what the user must see immediately. sections: caixa_atual, meses_reserva, faturamento, a_receber,
inadimplência, taxa_conversão, êxito projetado (escritório/parceiro), % metas. data: `GET /painel?ano`.
All via `<CalculatedValue>` (read-only, with tooltip + `recalculado_em`). primary surfaces alert-worthy
items: inadimplência > 0, radar com movimentação nova, tarefas vencidas. clickable → drill to the relevant
screen; the numbers themselves are read-only. empty: "sem dados para o ano". 

### UI-F12 Fluxo de caixa · `/fluxo`
`GET /fluxo-caixa?ano` → 12 chained months (entradas, saídas, resultado, saldo_acumulado). read-only chart +
table. The chained balance is calculated — **no editable monthly-balance cell** (the original spreadsheet
defect, made impossible). 

### UI-F13 Análises do mês · `/analises`
`GET /analises/mes?ano&mes` → faturamento, gastos por categoria, clientes fechados, restituições,
inadimplência. period selector; empty per period. read-only.

### UI-F14 DRE · `/dre`
`GET /dre?ano&mes` → receita, custos_diretos, despesas_operacionais, resultado, margem. margem may be null
(receita 0) → render "—". read-only.

### UI-F15 Balanço e projeções · `/balanco`
`GET /balanco?ano&mes` → caixa, a_receber_*, ativo, passivo, patrimônio_líquido; plus projeções from painel.
read-only.

### UI-F16 Contratos · `/contratos`
`GET /contratos?status&parceiro&cliente&limit&offset&order`. table (status, cliente, parceiro, tipo
honorário, valor causa, datas). filters persist. actions: **IX-C01 criar contrato**, row→UI-F17. empty:
"nenhum contrato". derived columns (fixo recebido/pendente, êxito projetado) are read-only.

### UI-F17 Detalhe do contrato · `/contratos/:id`
`GET /contratos/:id` + `GET /contratos/:id/parcelas`. sections: dados do contrato (editable via **IX-C02**),
parcelas (list + **IX-P01 confirmar**, **IX-P02 estornar**, add/edit/delete parcela), derived projections
(read-only). actions incl. **IX-C03 excluir contrato** → 409 unless cascade confirmed. 

### UI-F18 Parcelas · `/parcelas`
consolidated receivables across contracts (a receber / vencidas-inadimplência / recebidas), from
`GET /contratos/:id/parcelas` aggregated or a `/parcelas` list filter. actions: **IX-P01/IX-P02**. Confirm
opens a dialog for `mes_recebimento`+`data_pagamento` (IX-P01). 

### UI-F19 Lançamentos · `/lancamentos`
`GET /lancamentos?mes&tipo&categoria&pago`. actions: **IX-L01 novo lançamento** (optional `parcela_id`
quita parcela — link 2), **IX-L02 editar**, **IX-L03 excluir**. Entries are the only place money is typed;
`origem` shows provenance (manual/parcela/custo_fixo) read-only; entries born from a parcela/custo are
labeled and not freely editable in the fields the link owns. 

### UI-F20 Custos fixos · `/custos-fixos`
`GET /custos-fixos`. actions: **IX-F01 novo custo**, **IX-F02 editar**, **IX-F03 excluir**, **IX-F04 lançar
no caixa** (por competência → `POST /custos-fixos/:id/lancar`, 409 se já lançado no mês). suspected
duplicates surfaced (same descrição). 

### UI-F21 Tarefas · `/tarefas`
`GET /tarefas?status&origem`. actions: **IX-T01 nova tarefa**, **IX-T02 concluir**, **IX-T03 editar/excluir**.
origem badge (manual / radar_movimentacao / radar_inercia). The inertia "ligar no Balcão Virtual" tasks
appear here, auto-created.

### UI-F22 Radar de processos · `/radar`
`GET /processos?tribunal&ativo&status_radar` + `GET /radar/ultima`. actions: **IX-R01 executar radar**
(409 "já está rodando"), **IX-R02 novo processo** (CNJ validado → 422), **IX-R05 excluir processo**. Rows
show last status with **distinct visual states**: sucesso · sem movimentação · movimentação nova ·
timeout · erro · **exige senha** (→ IX-R04 cadastrar senha) · **aguardando scraper** (TJCE/TJBA — neutral,
not red). Pending TJCE/TJBA are visible and counted, never a failure. 

### UI-F23 Detalhe do processo · `/radar/:id`
one process: dados, últimas 3 movimentações, baseline, última consulta (status + `inconclusiva`), senha
state. actions: **IX-R03 criar tarefa da movimentação nova**, **IX-R04 cadastrar/atualizar senha** (goes to
the vault; never displayed), IX-R05 excluir. 

### UI-F24 Execuções / movimentações · `/radar/execucoes`
`GET /radar/execucoes` (history, per-status totals) + `GET /radar/movimentacoes-novas?execucao_id` (the
**manual curation queue**). action: **IX-R03** to turn a new movement into a task. History shown compactly
(paginated), not a heavy dump. Error email failures and captcha/degradation alerts are observability, shown
as run badges.

### UI-F25 Parâmetros e configurações · `/config`
`GET /parametros/:ano` + `PUT` (**IX-G01**: caixa inicial, metas, recorrência — the only typed config
numbers). `GET /configuracoes` + `PUT /configuracoes/:chave` (**IX-G02**: radar_cron, email de erros,
limiares). Derived indicators are explicitly **not** editable here.

### UI-F26 Auditoria · `/auditoria` (should)
read-only `auditoria` list (quem, o quê, valor antigo/novo, quando). filters by entidade/usuário/período.
insert-only trail; no edit/delete UI. 

### UI-F00 Estados globais
error boundary (uncaught → recoverable screen keeping nav); session-expired overlay → Login; API/DB
unavailable banner with retry. 

---

## 2. Component contracts (CMP-###) — key shared primitives

| ID | Component | Contract |
|---|---|---|
| CMP-01 | `<CalculatedValue>` | renders a derived number read-only: value, tooltip(origin), `recalculado_em`, stale badge. **No editable variant** (enforced by §8 validator). |
| CMP-02 | `<Money>` | BRL formatting, positive/negative treatment, never an input. |
| CMP-03 | `<DataTable>` | dense (35–40px rows), sort, pagination, per-row actions, collapses to cards < md. |
| CMP-04 | `<StateBoundary>` | the shared state model (§0) around any query. |
| CMP-05 | `<PeriodSelector>` | mês/ano persisted across screens (URL+store). |
| CMP-06 | `<ConfirmDialog>` | destructive/transactional confirmations (estorno, exclusão, cascade). |
| CMP-07 | `<RadarStatusBadge>` | the distinct radar states incl. neutral "aguardando scraper". |
| CMP-08 | `<FormField>` | react-hook-form + zod, 422 field mapping. |

## 3. Interaction contracts (IX-###)

Every action, bound to a real endpoint/local behavior. Format condensed; all include acceptance criteria +
tests. `error_mapping` uses the client's global map (§6 of plan) unless noted.

| IX | Screen | Action | Endpoint | Method | Key rules / states |
|---|---|---|---|---|---|
| IX-A01 | UI-F01 | login | Supabase Auth `signInWithPassword` | — | success→`GET /me`→route; invalid→field error; 429→backoff. **no fake login/token.** |
| IX-A02 | UI-F02/03 | set/update password | Supabase Auth `updateUser` | — | token expired→explain; success→login |
| IX-A03 | UI-F03 | request reset | Supabase Auth `resetPasswordForEmail` | — | neutral confirmation (no email enumeration) |
| IX-A04 | UI-F04/F10 | logout | Supabase Auth `signOut` | — | clears session + query cache → Login |
| IX-ME | guard | membership check | `/me` | GET | is_member=false→UI-F04; drives `<RequireMember>` |
| IX-C01 | UI-F16 | criar contrato | `/contratos` | POST | zod validate; success→detail; 422 field map |
| IX-C02 | UI-F17 | editar contrato | `/contratos/{id}` | PATCH | write allowlist; optimistic off; invalidate contrato+painel |
| IX-C03 | UI-F17 | excluir contrato | `/contratos/{id}` | DELETE | **409** if parcelas → ConfirmDialog `?cascade=true` |
| IX-P01 | UI-F17/18 | confirmar parcela | `/parcelas/{id}/confirmar` | POST | dialog: mes_recebimento+data_pagamento; creates entry (link 1); invalidate fluxo/painel/parcelas; double→**409** |
| IX-P02 | UI-F17/18 | estornar parcela | `/parcelas/{id}/estornar` | POST | ConfirmDialog; undoes both sides; invalidate |
| IX-P03 | UI-F17 | add/editar/excluir parcela | `/parcelas`,`/parcelas/{id}` | POST/PATCH/DELETE | validation; invalidate contrato |
| IX-L01 | UI-F19 | novo lançamento (opcional quita parcela) | `/lancamentos` | POST | `parcela_id` optional (link 2); NOT NULL data/descricao enforced client+server; invalidate fluxo/painel |
| IX-L02 | UI-F19 | editar lançamento | `/lancamentos/{id}` | PATCH | invalidate month |
| IX-L03 | UI-F19 | excluir lançamento | `/lancamentos/{id}` | DELETE | ConfirmDialog; invalidate |
| IX-F01/02/03 | UI-F20 | criar/editar/excluir custo | `/custos-fixos`,`/custos-fixos/{id}` | POST/PATCH/DELETE | validity window + dia_vencimento validation |
| IX-F04 | UI-F20 | lançar custo no caixa | `/custos-fixos/{id}/lancar` | POST | body competência; **409** já lançado no mês; **422** fora de vigência |
| IX-T01 | UI-F21 | nova tarefa | `/tarefas` | POST | validate |
| IX-T02 | UI-F21 | concluir tarefa | `/tarefas/{id}` | PATCH status=concluida | optimistic + rollback on error |
| IX-T03 | UI-F21 | editar/excluir tarefa | `/tarefas/{id}` | PATCH/DELETE | — |
| IX-R01 | UI-F22 | executar radar | `/radar/executar` | POST | **409** "o radar já está rodando"; returns execucao_id; poll `/radar/ultima` |
| IX-R02 | UI-F22 | novo processo | `/processos` | POST | CNJ format→**422**; created ativo, not queried immediately |
| IX-R03 | UI-F23/24 | criar tarefa da movimentação | `/movimentacoes/{id}/criar-tarefa` | POST | **409** if already a task (idempotent); marks virou_tarefa |
| IX-R04 | UI-F22/23 | cadastrar/atualizar senha | `/processos/{id}/senha` | PUT | goes to vault; response never echoes it; audited without value |
| IX-R05 | UI-F22/23 | excluir processo | `/processos/{id}` | DELETE | ConfirmDialog; cascades run history |
| IX-G01 | UI-F25 | salvar parâmetros | `/parametros/{ano}` | PUT | only the 4 config numbers; invalidate painel |
| IX-G02 | UI-F25 | salvar configuração | `/configuracoes/{chave}` | PUT | radar_cron/email/limiares |
| IX-H01 | all lists | filtros + paginação | resource GET | GET | filters persist; page state in URL |
| IX-409 | all mutations | conflito 409 | any | — | ConfirmDialog/message with the endpoint's `erro`, never a generic crash |

**Every button in every screen maps to exactly one IX above** → `frontend_surfaces_without_contract=0`,
`interactions_without_endpoint_or_local_contract=0`.

## 4. Frontend ↔ Backend ↔ DB matrix (brief §2)

> **CORRECTION (runtime/62):** CRUD for parceiros/contratos/lançamentos/custos-fixos/tarefas/processos
> **already EXISTS** via `_collection_routes` — read the rows below marked `N` for those resources as
> **`E` (exists), consume directly, do not recreate**. Genuinely-`N` (missing) = `/me`, `/radar/*`,
> `/auditoria`, and `GET /contratos/{id}` detail. See `runtime/62 §2`.

`E` = endpoint exists today · `N` = new (backend-completion, DEC-43).

| Tela | Ação | Endpoint | E/N | Regra de negócio | Tabelas | Permissão | Resposta | Estado visual | Teste |
|---|---|---|---|---|---|---|---|---|---|
| F01 | login | Supabase Auth | E | — | auth.users | público | session | error/success | AUTH |
| F04 | is_member | `/me` | **N** | current_user_is_app_member | app_members | authenticated | {is_member,papel} | 403→sem-acesso | AUTH |
| F11 | ver painel | `/painel` | E | derivado read-only | ind_painel | member | indicadores | loading/empty/stale | CALC |
| F12 | fluxo | `/fluxo-caixa` | E | corrente encadeada | ind_fluxo_mensal | member | 12 meses | read-only | CALC |
| F13 | análises | `/analises/mes` | E | derivado | ind_analise_mensal, ind_gastos_categoria | member | análises | por período | CALC |
| F14 | DRE | `/dre` | E | derivado | ind_dre_mensal | member | dre | margem null→"—" | CALC |
| F15 | balanço | `/balanco` | E | derivado | ind_balanco | member | balanço | read-only | CALC |
| F16 | listar contratos | `/contratos` | **N** | — | contratos, parceiros | member | lista | filtros/empty | CRUD |
| F16/17 | criar/editar contrato | `/contratos`,`/contratos/{id}` | **N** | write allowlist | contratos | member | contrato | 422 | CRUD |
| F17 | excluir contrato | `/contratos/{id}` | **N** | RESTRICT+cascade | contratos, parcelas | member | 200/409 | ConfirmDialog | TX |
| F17/18 | confirmar/estornar parcela | `/parcelas/{id}/confirmar`\|`/estornar` | E | ligação transacional | parcelas, lancamentos | member | 200/409 | dialog | TX |
| F19 | CRUD lançamentos | `/lancamentos` | **N** | quita parcela opcional | lancamentos, parcelas | member | 200/409/422 | forms | TX |
| F20 | CRUD custos + lançar | `/custos-fixos`(+`/lancar`) | **N** (lancar E) | idempotência mês | custos_fixos, lancamentos | member | 200/409/422 | dialog | TX |
| F21 | CRUD tarefas | `/tarefas` | **N** | idempotência inércia | tarefas | member | 200/409 | forms | CRUD |
| F22 | listar/executar radar | `/processos`,`/radar/*` | **N** | trava global | processos, execucoes_radar | member | 200/409 | badges | RADAR |
| F23 | criar tarefa mov. | `/movimentacoes/{id}/criar-tarefa` | E | idempotente | tarefas, movimentacoes_novas | member | 200/409 | success | TX |
| F22/23 | senha processo | `/processos/{id}/senha` | E | cofre; nunca exibida | processos + vault | member | 200 | sem valor | SEC |
| F25 | parâmetros/config | `/parametros/{ano}`,`/configuracoes/{chave}` | E | únicos números digitados | parametros, configuracoes | member | 200 | forms | CRUD |
| F26 | auditoria | (read via API `/auditoria`) | **N** | insert-only | auditoria | member | lista | read-only | SEC |

**Backend-completion required by the matrix:** `/me`, `/parceiros`, `/contratos*`, `/lancamentos*`,
`/custos-fixos*` (list/CRUD), `/tarefas*`, `/processos*` (list/create/delete), `/radar/*`, `/auditoria`
(read). Each has at least one consuming screen → no orphan endpoints.
