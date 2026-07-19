# 13 — API Contract & Backend Domain Plan

Every endpoint requires an authenticated session. Nothing is public.

Derived from `vendor/frontend/FRONTEND_REFERENCE_PAVAGEAU.md` — **vendored into this package** (DEC-40), not an external file.

---

## 0. Runtime identity — which role the API connects as

**Stack:** FastAPI (Python 3.12), same language as the vendored scraper, so the radar worker and the
API share the domain layer instead of duplicating it in a second runtime.

**Database identity — this is a security decision, not a config detail:**

| Component | Connects as | Consequence |
|---|---|---|
| API request handlers | **The caller's JWT**, forwarded to Postgres | **RLS applies.** This is what makes the `REVOKE` on `ind_*` a real control rather than an inert one. |
| Radar worker | **Dedicated Postgres role `radar_worker`** (`RADAR_DB_URL`) | Explicit `GRANT`s on radar tables only; no DDL, no `auth.*`, no financial tables, no `ind_*` |
| Recalculation functions | `SECURITY DEFINER`, owned by a migration role | The only writer of `ind_*` |
| Migrations | `service_role` | The **only** sanctioned use of `service_role` in the system |

**Nothing but migrations may use `service_role`.** It bypasses RLS entirely, so it can never be
"least privilege". If request handlers used it, NFR-01 ("no calculated value is user-writable") and
threat control T3 would be unenforceable while still appearing to pass review — the `REVOKE` would
sit on a role nobody connects as. The same reasoning applies to the worker, which is why it gets a
real Postgres role rather than a service key.

**Hosting:** the API is a container; host is not architecturally constrained (Fly.io / Railway /
the same host as the radar worker). Unlike the worker (DEC-23), it has no browser dependency.

---

## 1. CRUD surface

Standard REST for the primary facts. All writes emit an audit record and, where a fact feeds a
report, trigger scoped recalculation inside the same transaction.

| Resource | Endpoints |
|---|---|
| `parceiros` | `GET /parceiros`, `POST`, `PATCH /:id`, `DELETE /:id` |
| `contratos` | `GET /contratos` (filter: status, parceiro, cliente), `GET /:id`, `POST`, `PATCH /:id`, `DELETE /:id` |
| `parcelas` | `GET /contratos/:id/parcelas`, `POST`, `PATCH /:id`, `DELETE /:id` |
| `lancamentos` | `GET /lancamentos` (filter: mês, tipo, categoria, pago), `POST`, `PATCH /:id`, `DELETE /:id` |
| `custos-fixos` | `GET`, `POST`, `PATCH /:id`, `DELETE /:id` |
| `parametros` | `GET /parametros/:ano`, `PUT /parametros/:ano` |
| `tarefas` | `GET /tarefas` (filter: status, origem), `POST`, `PATCH /:id`, `DELETE /:id` |
| `processos` | `GET /processos`, `POST`, `PATCH /:id`, `DELETE /:id` |
| `configuracoes` | `GET /configuracoes`, `PUT /configuracoes/:chave` |

`DELETE /contratos/:id` returns **409** when instalments exist (schema `ON DELETE RESTRICT`), with a
count and a required `?cascade=true` to proceed — making the document's "must explicitly decide the
fate of the instalments" an actual API decision rather than a silent one.

### 1.1 Write allowlists (required, not optional)

**Every write endpoint accepts an explicit allowlist of fields.** Anything not listed is rejected
with 422 — not ignored, which would silently discard a client's intent.

This matters most on `PATCH /processos/:id`, whose writable set is exactly:

```
cliente · comarca_vara · fase_atual · ativo · monitorar · contrato_id · tribunal
```

Everything else on `processos` is **radar-owned state** and is not writable through the API:
`chaves_movimentacoes`, `data_ultimo_andamento`, `ultima_consulta_status`,
`ultima_consulta_inconclusiva`, `exige_senha`, `senha_ref`.

Without this, the RLS baseline (`USING (true)` — one office, one trust boundary) would let an
authenticated user overwrite the comparison baseline directly. Threat T6 defends against concurrent
*runs* corrupting baselines; this closes the same corruption arriving through the front door. It is
the reason the baseline protections in DEC-19 and TEST-RADAR-19 are meaningful.

`senha_ref` is never accepted on any endpoint and never appears in any response model. Response
models are allowlists too, so a new column cannot leak by default.

## 2. Read endpoints — derived reports

All served from materialized tables; all read-only. No PUT/PATCH exists for any of these — the
absence is the contract (DEC-04).

| Endpoint | Source table | Response fields |
|---|---|---|
| `GET /painel?ano=` | `ind_painel` | all columns (§4 data plan) |
| `GET /fluxo-caixa?ano=` | `ind_fluxo_mensal` | 12 chained months |
| `GET /dre?ano=&mes=` | `ind_dre_mensal` | receita, custos_diretos, despesas_operacionais, resultado, margem |
| `GET /balanco?ano=&mes=` | `ind_balanco` | caixa, a_receber_*, ativo, passivo, patrimonio_liquido |
| `GET /analises/mes?ano=&mes=` | `ind_analise_mensal` + `ind_gastos_categoria` | faturamento, clientes_fechados, restituicoes, inadimplencia, gastos por categoria |

`/analises/mes` is served from materialized tables like every other read endpoint — it is not
computed live, which keeps TEST-CALC-07 and the `recalculado_em` freshness contract intact.

Each response carries `recalculado_em` so the UI can prove freshness.

**Pagination and ordering** on collection endpoints (`/lancamentos`, `/contratos`, `/tarefas`,
`/processos`): `?limit=` (default 100, max 500), `?offset=`, `?order=` with a per-resource allowlist
of sortable columns. Default orders: `lancamentos` by `data` desc, `contratos` by `data_proposta`
desc, `tarefas` by `prazo` asc nulls last, `processos` by `numero`.

## 3. The three transactional links

The core of the "no number typed twice" guarantee. Each is one transaction — all of it commits or
none of it does.

### 3.1 `POST /parcelas/:id/confirmar`

Body: `{ "mes_recebimento": "YYYY-MM", "data_pagamento": "YYYY-MM-DD" | null }`

```
BEGIN
  -- mes_recebimento comes from the REQUEST, defaulting to the current month — never from
  -- mes_esperado. A late payment must land in the period it was actually received.
  parcela.recebido = true
  parcela.mes_recebimento = <body.mes_recebimento>

  INSERT lancamentos (
    data        = COALESCE(body.data_pagamento, last_day(mes_recebimento)),  -- NOT NULL
    descricao   = format('Parcela %s — %s', parcela.tipo, contrato.cliente), -- NOT NULL
    tipo        = 'entrada',
    valor       = parcela.valor,
    categoria   = 'honorarios',   -- every parcela type is fee income, incl. sucumbência
    pago        = true,
    contrato_id = parcela.contrato_id,
    origem      = 'parcela',
    origem_id   = parcela.id)

  recalcular_mes(year(mes_recebimento), month(mes_recebimento))   -- the RECEIVED month
  auditoria(...)
COMMIT
```

`data` and `descricao` are `NOT NULL` in the schema and are supplied explicitly — an insert omitting
them fails. The recalculated month is the **received** month, not the expected one; recalculating
the expected month would leave the real cash movement out of its own DRE period.

`ux_lanc_origem` makes double confirmation impossible at the database level → **409**.

`POST /parcelas/:id/estornar` reverses both sides atomically: deletes the origin-linked entry,
clears `recebido`/`mes_recebimento`, recalculates, audits. `ck_recebido_coerente` guarantees no
half-state can even be represented.

### 3.2 `POST /lancamentos` with optional `parcela_id`
A standalone entry may exist (money arrives outside a contract). When `parcela_id` is supplied, the
same transaction performs the entry **and** settles the instalment — identical end state to §3.1.
One typing, one fact. If the instalment is already received → **409**.

### 3.3 `POST /movimentacoes/:id/criar-tarefa`
Creates a task with `origem='radar_movimentacao'`, linking the movement, the process, and the
contract **via `processos.contrato_id`** — the authoritative FK. It does **not** match on client
name: `cliente` is free text, and homonyms, casing and accents make name matching a source of wrong
links. When `processos.contrato_id` is null, the task is created with no contract rather than a
guessed one. `numero_processo` is copied for display; `movimentacoes_novas.virou_tarefa = true`.
`ux_tarefa_movimentacao` guarantees one movement never produces two tasks → **409** on retry.

### 3.4 `POST /custos-fixos/:id/lancar` — the fourth transactional link

Body: `{ "competencia": "YYYY-MM" }`

The document requires fixed costs to offer a per-month post-to-cash action. It has a database
idempotency key, a test and a task; it needs an endpoint.

```
BEGIN
  INSERT lancamentos (
    data      = make_date(ano, mes,                       -- see 07 §2.5: LEAST of two
                    LEAST(COALESCE(custo.dia_vencimento, 31),        -- ints is a DAY NUMBER, not
                          days_in_month(competencia))),               -- a date; NULL-unsafe raw
    descricao = custo.descricao,
    tipo      = 'saida',
    valor     = custo.valor_mensal,
    categoria = 'custo_fixo',
    pago      = false,                       -- posted as due; settled by editing when paid
    origem    = 'custo_fixo',
    origem_id = format('%s:%s', custo.id, competencia))   -- the idempotency key
  recalcular_mes(...)
  auditoria(...)
COMMIT
```

**409** when already posted for that month (`ux_lanc_origem`), and **422** when `competencia` falls
outside `[mes_inicio, mes_fim]`, or when the cost is `recorrente = false` and `competencia` is not
`mes_inicio`. A repeat post for the *same* month is always **409** (`ux_lanc_origem`), never 422 — the
two codes never contend for the same case.

## 4. Radar endpoints

| Endpoint | Behavior |
|---|---|
| `POST /radar/executar` | Manual run. **409** `{"erro":"o radar já está rodando"}` when the advisory lock is held. Records the triggering user. Returns `execucao_id` immediately; the run is asynchronous. |
| `GET /radar/execucoes?limit=` | Run history with per-status totals |
| `GET /radar/execucoes/:id` | One run + its per-process results |
| `GET /radar/ultima` | Most recent run — the dashboard's radar panel |
| `GET /radar/movimentacoes-novas?execucao_id=` | The manual curation queue (DEC-06) |
| `PUT /processos/:id/senha` | Registers/updates the process password. Body carries the password; it goes **straight to the vault**, and only `senha_ref` is persisted. Response **never** echoes it. Audited as "password registered" with no value. |
| `DELETE /processos/:id` | Permanent deletion incl. run history (DEC-08, `ON DELETE CASCADE`) |

**`POST /processos`** creates a process as `ativo` but does **not** query it immediately — it joins
the next scheduled or manual run, exactly as specified.

## 5. Backend module layout

```
app/
  domain/        contratos, parcelas, lancamentos, custos, parametros, tarefas
  reports/       recalculo.py  (mirrors the SQL functions; the fixture-tested reference)
  radar/
    orchestrator.py
    scrapers/
      base.py          # ScraperTribunal protocol
      registry.py      # TJSP live · TJCE reserved · TJBA reserved
      tjsp.py          # adapter
      vendor/consulta_tjsp_lote.py   # FROZEN (DEC-17)
    comparacao.py      # deterministic keys, baseline diff
    inercia.py         # 30-day rule (DEC-19)
    notificacao.py     # technical error email
  security/      vault.py, redaction.py, audit.py
  api/           routers
```

## 6. Errors

Uniform shape `{ "erro": str, "detalhe": str|null, "codigo": str }`.

| Code | Meaning |
|---|---|
| 401 | No session |
| 403 | RLS denied |
| 404 | Not found |
| **409** | Idempotency/state conflict: run in progress, instalment already received, movement already a task, contract with instalments |
| 422 | Validation |
| 500 | Unexpected — logged with correlation id, never leaking internals |

409 carries real semantic weight in this system: it is how every idempotency guarantee surfaces to
the client, and each one is backed by a database constraint rather than an application check.
