# 07 — Data Architecture Plan

Platform: **Supabase / PostgreSQL** (DEC-01). Region: **`sa-east-1`**, resolved as validated
configuration `AWS_REGION` (DEC-35, `17-deployment-and-configuration.md` §1). Local and CI run on
plain Postgres 16 and never read it.

The governing rule: **the database stores facts; reports are functions over facts.** Every column
below is either a primary fact the user enters, or a derived value the system writes and the user
can never touch (DEC-04).

---

## 1. Enumerated types — closing the vocabulary

Each enum below exists because free text in the spreadsheet produced a real, counted defect.

```sql
CREATE TYPE contrato_status AS ENUM
  ('proposta','ativo','aguardando_exito','encerrado','sem_exito');

CREATE TYPE tipo_honorario AS ENUM
  ('fixo_unico','fixo_mensal','fixo_parcelado','exito_puro','sucumbencia',
   'fixo_exito','exito_sucumbencia','fixo_exito_sucumbencia');

CREATE TYPE parcela_tipo AS ENUM ('inicial','mensal','exito','sucumbencia');

CREATE TYPE lancamento_tipo AS ENUM ('entrada','saida');

CREATE TYPE lancamento_origem AS ENUM ('manual','parcela','custo_fixo');

CREATE TYPE categoria_lancamento AS ENUM
  ('honorarios','consultoria','custas_processuais','restituicao_cliente',
   'custo_fixo','impostos','marketing','infraestrutura','freelancer',
   'pro_labore','outras_entradas','outras_saidas');

CREATE TYPE tarefa_status AS ENUM ('aberta','concluida');
CREATE TYPE tarefa_origem AS ENUM ('manual','radar_movimentacao','radar_inercia');

-- Tribunals are a closed list for the same reason every other vocabulary here is (see §3.1).
-- Adding one is `ALTER TYPE tribunal_sigla ADD VALUE 'TJMG';` plus a registry line.
CREATE TYPE tribunal_sigla AS ENUM ('TJSP','TJCE','TJBA');

CREATE TYPE execucao_origem AS ENUM ('agendada','manual');
CREATE TYPE execucao_status AS ENUM
  ('em_andamento','concluida','interrompida','falhou_parcialmente');

-- Source of truth is the working scraper's vocabulary (DEC-26), not the prose list.
CREATE TYPE consulta_status AS ENUM
  ('sucesso','base_inicial_criada','nao_localizado','numero_invalido',
   'senha_necessaria','captcha_timeout','pagina_intermediaria','timeout',
   'erro','pendente_implementacao');
```

> **Slug values, accented labels.** Enum values are unaccented slugs; the accented label
> (`Aguardando êxito`) is a presentation concern. This is precisely what stopped
> `"Aguardando êxito"` and `"Aguardando exito"` from being counted as two different things.
> `tipo_honorario` collapses the spreadsheet's ~15 spellings onto 8 real types.

## 2. Primary fact tables

### 2.1 `parceiros`
```sql
CREATE TABLE parceiros (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        text NOT NULL UNIQUE,
  ativo       boolean NOT NULL DEFAULT true,
  criado_em   timestamptz NOT NULL DEFAULT now()
);
```
Seeded: Pavageau, Leardini, Instagram, Gonçalves/Mello, A&E Advogados, Eliton Vilalta.
Being a referenced table is what makes a partner with active contracts **impossible** to omit from
the dashboard — the defect where one partner vanished entirely.

### 2.2 `contratos`
```sql
CREATE TABLE contratos (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente                 text NOT NULL,
  parceiro_id             uuid NOT NULL REFERENCES parceiros(id) ON DELETE RESTRICT,
  numero_processo         text,
  status                  contrato_status NOT NULL DEFAULT 'proposta',
  tipo_honorario          tipo_honorario NOT NULL,
  percentual_exito        numeric(5,4) NOT NULL DEFAULT 0 CHECK (percentual_exito       BETWEEN 0 AND 1),
  percentual_sucumbencia  numeric(5,4) NOT NULL DEFAULT 0 CHECK (percentual_sucumbencia BETWEEN 0 AND 1),
  percentual_quota        numeric(5,4) NOT NULL DEFAULT 0 CHECK (percentual_quota       BETWEEN 0 AND 1),
  honorario_fixo_total    numeric(14,2) NOT NULL DEFAULT 0 CHECK (honorario_fixo_total >= 0),
  valor_causa             numeric(14,2) NOT NULL DEFAULT 0 CHECK (valor_causa          >= 0),
  apelido_split           text,
  observacoes             text,
  data_proposta           date,
  data_fechamento         date,
  criado_em               timestamptz NOT NULL DEFAULT now(),
  atualizado_em           timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT ck_fechamento_apos_proposta
    CHECK (data_fechamento IS NULL OR data_proposta IS NULL OR data_fechamento >= data_proposta)
);
```

> **`percentual_quota` is the PARTNER's share.** This definition is load-bearing and is why it is
> documented in the schema itself via `COMMENT ON COLUMN`:
> ```
> êxito projetado do escritório = valor_causa × percentual_exito × (1 − percentual_quota)
> êxito projetado do parceiro   = valor_causa × percentual_exito ×      percentual_quota
> ```
> Reading `quota` as the office's share inverts every projection in the system.

**Deliberately absent:** `fixo_recebido`, `fixo_pendente`, `exito_projetado`,
`sucumbencia_projetada`. These are derived (§5). A column for them would be a place to type over a
calculation — the original defect.

Percentages are stored as **fractions** (`0.30`), not `30`. One representation, no ×100 ambiguity.

### 2.3 `parcelas`
```sql
CREATE TABLE parcelas (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id      uuid NOT NULL REFERENCES contratos(id) ON DELETE RESTRICT,
  tipo             parcela_tipo NOT NULL,
  valor            numeric(14,2) NOT NULL CHECK (valor > 0),
  mes_esperado     date NOT NULL,          -- always day 1; month granularity
  recebido         boolean NOT NULL DEFAULT false,
  mes_recebimento  date,
  observacoes      text,
  criado_em        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT ck_recebido_coerente
    CHECK ((recebido AND mes_recebimento IS NOT NULL)
        OR (NOT recebido AND mes_recebimento IS NULL))
);
CREATE INDEX ix_parcelas_contrato ON parcelas(contrato_id);
CREATE INDEX ix_parcelas_abertas  ON parcelas(mes_esperado) WHERE NOT recebido;
```

**`ON DELETE RESTRICT` is the deliberate answer** to the document's requirement that deleting a
contract must explicitly decide what happens to its instalments — *and the policy must live in the
schema, not in a programmer's head.* RESTRICT forces the caller to deal with them consciously;
CASCADE would silently destroy receivables history, which for a law firm is destroying financial
evidence. The API exposes an explicit "delete contract and its instalments" operation that removes
children in-transaction after confirmation.

`ck_recebido_coerente` makes "received with no date" and "date with not received" unrepresentable —
the class of inconsistency the three transactional links exist to prevent.

### 2.4 `lancamentos`
The only place money is actually typed.
```sql
CREATE TABLE lancamentos (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data             date NOT NULL,
  descricao        text NOT NULL,
  tipo             lancamento_tipo NOT NULL,
  valor            numeric(14,2) NOT NULL CHECK (valor > 0),
  categoria        categoria_lancamento NOT NULL,
  forma_pagamento  text,
  pago             boolean NOT NULL DEFAULT true,   -- the spreadsheet's SIM/PENDENTE
  contrato_id      uuid REFERENCES contratos(id) ON DELETE SET NULL,
  observacoes      text,
  origem           lancamento_origem NOT NULL DEFAULT 'manual',
  origem_id        text,
  criado_em        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT ck_origem_id_presente
    CHECK ((origem = 'manual' AND origem_id IS NULL)
        OR (origem <> 'manual' AND origem_id IS NOT NULL))
);

-- Money is always positive; direction lives in `tipo`. Signing happens in the calc engine.

-- NOT date_trunc(): with a `date` argument, resolution favors the timestamptz overload,
-- which is STABLE, and Postgres rejects it in an index expression ("must be marked IMMUTABLE").
-- A plain btree serves the month-range scans and does not force queries to reproduce an expression.
CREATE INDEX ix_lanc_competencia ON lancamentos(data) WHERE pago;
CREATE INDEX ix_lanc_contrato     ON lancamentos(contrato_id) WHERE contrato_id IS NOT NULL;
CREATE UNIQUE INDEX ux_lanc_origem ON lancamentos(origem, origem_id)
  WHERE origem <> 'manual';
```

**`ux_lanc_origem` is the idempotency guarantee**, and it enforces two separate rules with one index:
- a fixed cost cannot be posted twice in the same month — `origem_id = '<custo_id>:<YYYY-MM>'`, exactly the composite key the document specifies;
- an instalment cannot produce two entries — `origem_id = '<parcela_id>'`.

Enforced by the database, not by service-layer discipline.

### 2.5 `custos_fixos`
```sql
CREATE TABLE custos_fixos (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao      text NOT NULL,
  valor_mensal   numeric(14,2) NOT NULL CHECK (valor_mensal > 0),
  recorrente     boolean NOT NULL DEFAULT true,
  dia_vencimento smallint CHECK (dia_vencimento BETWEEN 1 AND 31),
  mes_inicio     date NOT NULL,
  mes_fim        date,                                  -- the spreadsheet had no end
  criado_em      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ck_vigencia CHECK (mes_fim IS NULL OR mes_fim >= mes_inicio)
);
```
`mes_fim` closes the "cost that starts and never ends" defect. Duplicate `Contador` entries become
visible rather than hidden — intentionally **not** a UNIQUE constraint, since two genuinely
different costs may share a description; the dashboard surfaces suspected duplicates instead.

**Semantics of `recorrente` vs the validity window** (these overlap and must not be left to
inference):
- `recorrente = true` → offered for posting in **every** month within `[mes_inicio, mes_fim]`, and
  counted in `custo_fixo_mensal` (§5).
- `recorrente = false` → offered **once**, in `mes_inicio` only, and **excluded** from
  `custo_fixo_mensal`, because a one-off is not a recurring burden and would distort `meses_reserva`.

**`dia_vencimento`, short months, and NULL:** the posting action derives the entry **date** as

```sql
make_date(ano, mes, LEAST(COALESCE(custo.dia_vencimento, 31),
                          EXTRACT(day FROM (make_date(ano,mes,1) + interval '1 month - 1 day'))::int))
```

`LEAST` of two integers is a day *number*, not a date — it must be wrapped in `make_date`, since
`lancamentos.data` is `date NOT NULL`. Day 31 in a 30-day month clamps to the 30th instead of
raising on an invalid date. `dia_vencimento` is nullable, and Postgres `LEAST` **ignores** NULLs, so
without the `COALESCE` a cost with no due day would silently post on whatever the other operand was;
`COALESCE(..., 31)` makes the intent explicit — no due day means end of month.

Fixed costs generate nothing on their own; they offer a per-month "post to cash" action
(`POST /custos-fixos/:id/lancar`, §13.3.4), deduplicated by `ux_lanc_origem`.

### 2.6 `parametros`
```sql
CREATE TABLE parametros (
  ano                     smallint PRIMARY KEY,
  caixa_inicial_ano       numeric(14,2) NOT NULL DEFAULT 0,
  meta_caixa_ano          numeric(14,2) NOT NULL DEFAULT 0,
  meta_recorrencia_mensal numeric(14,2) NOT NULL DEFAULT 0,
  recorrencia_atual       numeric(14,2) NOT NULL DEFAULT 0,
  atualizado_em           timestamptz NOT NULL DEFAULT now()
);
```
The only **financial** configuration numbers in the system. Reserve months, recurring-revenue %,
monthly fixed cost and goal attainment are **derived** and have no columns (formulas in §5).

### 2.6b `configuracoes` — operational settings

Distinct from `parametros`, which holds financial figures. This table exists because three
requirements say "configurable" and had nowhere to live: the weekly run time, the error-email
recipient, and the inertia threshold.

```sql
CREATE TABLE configuracoes (
  chave          text PRIMARY KEY,
  valor          text NOT NULL,
  descricao      text,
  atualizado_em  timestamptz NOT NULL DEFAULT now()
);

INSERT INTO configuracoes (chave, valor, descricao) VALUES
  ('radar_cron',            '0 3 * * 1',              'Weekly run schedule (cron, America/Sao_Paulo)'),
  ('radar_email_erros',     'gacamargo2003@gmail.com','Technical error report recipient (DEC-09)'),
  ('radar_inercia_dias',    '30',                     'Inertia rule threshold in days'),
  ('radar_alerta_sem_rodada_dias','8',                'Alert when no run completes within N days');
```

Read at run start, so changing the schedule or the recipient requires no deploy — which is what
"configurable" was meant to mean. Exposed via `GET /configuracoes` and `PUT /configuracoes/:chave` (13 §1). Values are
non-secret by construction; credentials stay in env vars.

### 2.7 `tarefas`
```sql
CREATE TABLE tarefas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo          text NOT NULL,
  contrato_id     uuid REFERENCES contratos(id) ON DELETE SET NULL,
  responsavel     text,
  prazo           date,
  status          tarefa_status NOT NULL DEFAULT 'aberta',
  origem          tarefa_origem NOT NULL DEFAULT 'manual',
  movimentacao_id uuid REFERENCES movimentacoes_novas(id) ON DELETE SET NULL,
  processo_id     uuid REFERENCES processos(id) ON DELETE SET NULL,
  numero_processo text,
  criado_em       timestamptz NOT NULL DEFAULT now()
);

-- Idempotency, link 3: one movement can never spawn two tasks.
CREATE UNIQUE INDEX ux_tarefa_movimentacao ON tarefas(movimentacao_id)
  WHERE movimentacao_id IS NOT NULL;

-- Idempotency, inertia rule: at most ONE OPEN inertia task per process.
CREATE UNIQUE INDEX ux_tarefa_inercia_aberta ON tarefas(processo_id)
  WHERE origem = 'radar_inercia' AND status = 'aberta';
```

`ux_tarefa_inercia_aberta` is the document's idempotency requirement expressed as a constraint: the
weekly run may re-attempt creation freely and the database refuses the duplicate. Once the task is
completed the partial index releases, so a process that stalls again later can legitimately raise a
new one.

`numero_processo` is denormalized **for display**, so a task still reads correctly after its process
is deleted (DEC-08 deletes processes permanently).

## 3. Radar tables

### 3.1 `processos`
```sql
CREATE TABLE processos (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero                text NOT NULL UNIQUE
    -- The real 106-process run produced 1 `numero_invalido`. Without this, a bad number
    -- silently consumes a browser slot every week, forever.
    CONSTRAINT ck_numero_cnj CHECK (numero ~ '^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$'),
  contrato_id           uuid REFERENCES contratos(id) ON DELETE SET NULL,
  cliente               text,
  -- An enum, not free text — the same doctrine as §1. With free text, `TJ-SP` or a trailing
  -- character routes to `pendente_implementacao` forever, and because that status is by design
  -- NOT a failure, the typo is undetectable. Adding a tribunal = one ALTER TYPE.
  tribunal              tribunal_sigla NOT NULL,
  comarca_vara          text,
  fase_atual            text,
  ativo                 boolean NOT NULL DEFAULT true,
  monitorar             boolean NOT NULL DEFAULT true,
  data_ultimo_andamento date,
  chaves_movimentacoes  text[] NOT NULL DEFAULT '{}',   -- comparison baseline
  exige_senha           boolean NOT NULL DEFAULT false,
  senha_ref             text,                            -- vault REFERENCE, never the secret
  ultima_consulta_status      consulta_status,
  ultima_consulta_em          timestamptz,
  ultima_consulta_inconclusiva boolean NOT NULL DEFAULT false,
  criado_em             timestamptz NOT NULL DEFAULT now(),

  -- A regex, not a length bound: a 200-char limit excludes essentially no real password, so it
  -- would not actually prevent one being parked here. Same precedent as ck_numero_cnj (DEC-31).
  CONSTRAINT ck_senha_ref_formato
    CHECK (senha_ref IS NULL OR senha_ref ~ '^vault:[0-9a-f-]{36}$')
);
CREATE INDEX ix_processos_radar ON processos(tribunal) WHERE ativo AND monitorar;
```

- `chaves_movimentacoes` holds the baseline inline. A separate table would be one join per process
  per run for data that is always read and written as a whole set of ≤3.
- **`senha_ref` stores a vault reference only** (DEC-05). A **format `CHECK`** (`^vault:<uuid>$`)
  makes it structurally impossible to park a real password there — a mere length bound would not,
  since it excludes essentially no real password. A column-level `REVOKE SELECT (senha_ref)` keeps
  it out of ordinary reads (09 §3), and a `COMMENT` states the rule.
- `ultima_consulta_inconclusiva` implements **DEC-19**: set on timeout/captcha/error, so the UI can
  distinguish "quiet process" from "we couldn't check", and the inertia rule can exclude it.

### 3.2 `execucoes_radar`
```sql
CREATE TABLE execucoes_radar (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origem        execucao_origem NOT NULL,
  usuario_id    uuid REFERENCES auth.users(id),   -- required when origem='manual'
  iniciada_em   timestamptz NOT NULL DEFAULT now(),
  finalizada_em timestamptz,
  status        execucao_status NOT NULL DEFAULT 'em_andamento',
  heartbeat_em  timestamptz NOT NULL DEFAULT now(),
  total_consultados               integer NOT NULL DEFAULT 0,
  total_sucesso                   integer NOT NULL DEFAULT 0,
  total_com_movimentacao_nova     integer NOT NULL DEFAULT 0,
  total_sem_movimentacao          integer NOT NULL DEFAULT 0,
  total_senha_necessaria          integer NOT NULL DEFAULT 0,
  total_nao_localizado            integer NOT NULL DEFAULT 0,
  total_captcha_timeout           integer NOT NULL DEFAULT 0,
  total_timeout                   integer NOT NULL DEFAULT 0,
  total_pendente_implementacao    integer NOT NULL DEFAULT 0,
  -- Every `consulta_status` value needs a counter, or the run summary and the error email
  -- cannot report it. `numero_invalido` and `pagina_intermediaria` both occurred in the real run.
  total_base_inicial_criada       integer NOT NULL DEFAULT 0,
  total_numero_invalido           integer NOT NULL DEFAULT 0,
  total_pagina_intermediaria      integer NOT NULL DEFAULT 0,
  total_erro                      integer NOT NULL DEFAULT 0,
  CONSTRAINT ck_manual_tem_usuario
    CHECK (origem <> 'manual' OR usuario_id IS NOT NULL)
);
```
Totals update incrementally per process, so an interruption leaves coherent partial state.
`heartbeat_em` lets a reaper mark abandoned runs `interrompida` (§ integration plan §6).
`total_captcha_timeout` and `total_pendente_implementacao` exist as first-class counters because they
are the two early-warning signals.

### 3.3 `resultados_consulta`
```sql
CREATE TABLE resultados_consulta (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  execucao_id             uuid NOT NULL REFERENCES execucoes_radar(id) ON DELETE CASCADE,
  processo_id             uuid REFERENCES processos(id) ON DELETE CASCADE,
  numero_processo         text NOT NULL,
  tribunal                tribunal_sigla NOT NULL,   -- same closed vocabulary as processos (DEC-31)
  consultado_em           timestamptz NOT NULL DEFAULT now(),
  status                  consulta_status NOT NULL,
  quantidade_movimentacoes smallint NOT NULL DEFAULT 0,
  movimentacoes           jsonb NOT NULL DEFAULT '[]',   -- ≤3, each with its chave
  layout_movimentacoes    text,                          -- eproc_eventos | container_movimentacao | ...
  tem_movimentacao_nova   boolean NOT NULL DEFAULT false,
  data_movimentacao_recente date,
  url_resultado           text,
  mensagem_erro           text,
  tipo_erro               text,
  -- The error email is required to report the STEP where a query failed. Without persisting it,
  -- the email cannot carry a field the source document mandates.
  etapa                   text,   -- matches Etapa in 15 §2: abrir_aba | aguardar_formulario |
                                  -- preencher | consultar | aguardar_resultado | extrair | submeter_senha
  duracao_segundos        numeric(8,3)
);
CREATE INDEX ix_resultados_execucao ON resultados_consulta(execucao_id);
CREATE INDEX ix_resultados_processo ON resultados_consulta(processo_id, consultado_em DESC);
```
`ON DELETE CASCADE` on `processo_id` implements DEC-08 (closing a process removes its history).
`layout_movimentacoes` is persisted deliberately: it is the telemetry that would reveal TJSP
changing its rendering — a layout distribution shifting away from the observed 51/43 split is an
early warning that extraction is drifting.

### 3.4 `movimentacoes_novas`
```sql
CREATE TABLE movimentacoes_novas (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  execucao_id  uuid NOT NULL REFERENCES execucoes_radar(id) ON DELETE CASCADE,
  processo_id  uuid NOT NULL REFERENCES processos(id) ON DELETE CASCADE,
  resultado_id uuid NOT NULL REFERENCES resultados_consulta(id) ON DELETE CASCADE,
  chave        text NOT NULL,
  data_hora    text,
  descricao    text NOT NULL,
  virou_tarefa boolean NOT NULL DEFAULT false,
  criado_em    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ux_mov_processo_chave UNIQUE (processo_id, chave)
);
```
This is the manual-curation queue (DEC-06). `UNIQUE (processo_id, chave)` means the same movement
cannot be queued twice even across runs.

### 3.4b `import_log` — loader decisions (FR-44)

Created in **Phase 1** (`007_auditoria.sql`), not by the loader, so `009_rls.sql` covers it like every
other table. A table holding client financial import decisions must never be created after the RLS
pass.

```sql
CREATE TABLE import_log (
  id            bigserial PRIMARY KEY,
  execucao_id   uuid NOT NULL,              -- one loader invocation
  arquivo       text NOT NULL,              -- 'fluxo_caixa' | 'contratos'
  aba           text NOT NULL,
  linha         integer,
  coluna        text,
  acao          text NOT NULL,              -- mapeado|criado|reconciliado|aviso|erro|descartado
  valor_origem  text,
  valor_final   text,
  entidade      text,
  entidade_id   uuid,
  severidade    text NOT NULL DEFAULT 'info' CHECK (severidade IN ('info','aviso','erro')),
  chave_linha   text,                       -- sha256(aba|row-identity): the idempotency key
  criado_em     timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ux_import_linha ON import_log(arquivo, aba, chave_linha)
  WHERE chave_linha IS NOT NULL;
CREATE INDEX ix_import_severidade ON import_log(severidade) WHERE severidade <> 'info';
```

`ux_import_linha` is the idempotency guarantee: re-running the loader cannot duplicate a row.
Like `auditoria`, `import_log` is **insert-only** — INSERT policy only, no UPDATE/DELETE policy.

**`revisar` flags.** Entities the loader auto-creates to repair source defects are marked for human
review rather than silently accepted:

```sql
ALTER TABLE contratos ADD COLUMN revisar boolean NOT NULL DEFAULT false;
ALTER TABLE parceiros ADD COLUMN revisar boolean NOT NULL DEFAULT false;
```

Set when a stub contract is created for an orphaned `MENSAIS` client, or a partner is auto-created
from a contract row. Surfaced by `GET /contratos?revisar=true`. These columns are declared in
`003_contratos.sql` and `002_parceiros.sql` — **not** added later by the loader.

### 3.5 `auditoria`
```sql
CREATE TABLE auditoria (
  id            bigserial PRIMARY KEY,
  usuario_id    uuid REFERENCES auth.users(id),
  entidade      text NOT NULL,
  entidade_id   text,
  acao          text NOT NULL,
  valor_antigo  jsonb,
  valor_novo    jsonb,
  criado_em     timestamptz NOT NULL DEFAULT now()
);
```
**Insert-only, enforced by RLS**: an INSERT policy exists; no UPDATE or DELETE policy exists at all,
so those are denied by default even to authenticated users. A `BEFORE UPDATE OR DELETE` trigger
raises as a second layer. Covers value edits, instalment confirm/reverse, contract status changes,
process deletion, password registration and run triggering.

**Redaction is mandatory:** the audit writer strips any key matching `senha|password|token|secret`
from `valor_antigo`/`valor_novo` before insert. Without this, registering a process password would
write the password into the audit trail in plaintext — the exact leak DEC-05 exists to prevent.

## 4. Materialized result tables — full column definitions

Read-only to users (DEC-04). No API path writes them; only recalculation functions do.
**These column names are the API response contract** for `/painel`, `/fluxo-caixa`, `/dre`,
`/balanco` and `/analises/mes`.

```sql
CREATE TABLE ind_fluxo_mensal (
  ano smallint NOT NULL, mes smallint NOT NULL CHECK (mes BETWEEN 1 AND 12),
  entradas_pagas      numeric(14,2) NOT NULL DEFAULT 0,
  saidas_pagas        numeric(14,2) NOT NULL DEFAULT 0,
  resultado_mes       numeric(14,2) NOT NULL DEFAULT 0,   -- entradas − saidas
  saldo_acumulado     numeric(14,2) NOT NULL DEFAULT 0,   -- the chain
  recalculado_em      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (ano, mes)
);

CREATE TABLE ind_dre_mensal (
  ano smallint NOT NULL, mes smallint NOT NULL CHECK (mes BETWEEN 1 AND 12),
  receita                numeric(14,2) NOT NULL DEFAULT 0,
  custos_diretos         numeric(14,2) NOT NULL DEFAULT 0,
  despesas_operacionais  numeric(14,2) NOT NULL DEFAULT 0,
  resultado              numeric(14,2) NOT NULL DEFAULT 0,
  margem                 numeric(6,4),                     -- NULL when receita = 0
  recalculado_em         timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (ano, mes)
);

CREATE TABLE ind_balanco (
  ano smallint NOT NULL, mes smallint NOT NULL CHECK (mes BETWEEN 1 AND 12),
  caixa                 numeric(14,2) NOT NULL DEFAULT 0,
  a_receber_total       numeric(14,2) NOT NULL DEFAULT 0,  -- vencido + a vencer (see §5)
  a_receber_vencido     numeric(14,2) NOT NULL DEFAULT 0,
  a_receber_a_vencer    numeric(14,2) NOT NULL DEFAULT 0,
  ativo                 numeric(14,2) NOT NULL DEFAULT 0,
  passivo               numeric(14,2) NOT NULL DEFAULT 0,
  patrimonio_liquido    numeric(14,2) NOT NULL DEFAULT 0,
  recalculado_em        timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (ano, mes)
);

CREATE TABLE ind_gastos_categoria (          -- serves /analises/mes
  ano smallint NOT NULL, mes smallint NOT NULL,
  categoria      categoria_lancamento NOT NULL,
  total          numeric(14,2) NOT NULL DEFAULT 0,
  recalculado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (ano, mes, categoria)
);

CREATE TABLE ind_analise_mensal (            -- the rest of /analises/mes
  ano smallint NOT NULL, mes smallint NOT NULL,
  faturamento        numeric(14,2) NOT NULL DEFAULT 0,
  clientes_fechados  integer      NOT NULL DEFAULT 0,   -- contratos com data_fechamento no mês
  restituicoes       numeric(14,2) NOT NULL DEFAULT 0,  -- saídas pagas cat. restituicao_cliente
  inadimplencia      numeric(14,2) NOT NULL DEFAULT 0,
  recalculado_em     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (ano, mes)
);

CREATE TABLE ind_painel (
  ano smallint PRIMARY KEY,
  -- The panel is a POINT-IN-TIME view, so its as-of month must be explicit and stored.
  -- Without it, `custo_fixo_mensal`, `a_receber_*`, `inadimplencia` and `meses_reserva` are
  -- undefined (December? latest activity? today?) and give materially different dashboards.
  -- Rule: mes_referencia = 12 for a past year; for the current year, the current month.
  mes_referencia              smallint NOT NULL CHECK (mes_referencia BETWEEN 1 AND 12),
  caixa_atual                 numeric(14,2) NOT NULL DEFAULT 0,
  meses_reserva               numeric(6,2),              -- NULL when custo fixo = 0
  custo_fixo_mensal           numeric(14,2) NOT NULL DEFAULT 0,
  percentual_receita_recorrente numeric(6,4),            -- NULL when receita = 0
  percentual_meta_caixa       numeric(6,4),              -- NULL when meta = 0
  percentual_meta_recorrencia numeric(6,4),              -- NULL when meta = 0
  a_receber_total             numeric(14,2) NOT NULL DEFAULT 0,
  inadimplencia               numeric(14,2) NOT NULL DEFAULT 0,
  taxa_conversao              numeric(6,4),              -- NULL when nenhuma proposta
  exito_projetado_escritorio  numeric(14,2) NOT NULL DEFAULT 0,
  exito_projetado_parceiro    numeric(14,2) NOT NULL DEFAULT 0,
  sucumbencia_projetada       numeric(14,2) NOT NULL DEFAULT 0,
  recalculado_em              timestamptz NOT NULL DEFAULT now()
);
```

All are `REVOKE`d from the app role for INSERT/UPDATE/DELETE and written exclusively by
`SECURITY DEFINER` recalculation functions — so "the user cannot type over the calculated cash
balance" is a **privilege fact**, not a UI convention.

> **Field names must be reconciled against `vendor/frontend/FRONTEND_REFERENCE_PAVAGEAU.md` in T-036** before the
> read endpoints are frozen (DEC-21). The frontend already exists and is the contract; where it
> names a field differently, the frontend wins.

## 5. Derived formulas (single source of truth)

**Every formula is evaluated *as of* a reference month (`ano`, `mes`), never against
`current_date`.** A materialized row keyed by `(ano, mes)` whose formula depends on "today" silently
goes stale at every month boundary with no fact having changed — which would break the TEST-CALC-07
invariant on the first day of every month. `fim_mes := (make_date(ano,mes,1) + interval '1 month - 1 day')`.

| Metric | Definition (as of `ano`,`mes`) |
|---|---|
| `entradas_pagas` | `Σ valor` — `lancamentos` `pago`, `tipo='entrada'`, `data` within the month |
| `saidas_pagas` | `Σ valor` — `lancamentos` `pago`, `tipo='saida'`, `data` within the month |
| `resultado_mes` | `entradas_pagas − saidas_pagas` |
| `saldo_acumulado[n]` | `saldo_acumulado[n−1] + resultado_mes[n]`; **month 1 seeds from `parametros(ano).caixa_inicial_ano`** |
| `caixa_atual` | `saldo_acumulado` of the **latest month with any activity in `ano`** — *not* a global sum, so year N+1 does not double-count year N |
| `dre.receita` | `entradas_pagas` |
| `dre.custos_diretos` | `Σ` paid exits in `custas_processuais`, `restituicao_cliente` |
| `dre.despesas_operacionais` | `Σ` paid exits in every other category |
| `dre.resultado` | `receita − custos_diretos − despesas_operacionais` |
| `dre.margem` | `resultado / NULLIF(receita,0)` |
| `a_receber_vencido` | `Σ parcelas` `NOT recebido AND mes_esperado <= fim_mes` |
| `a_receber_a_vencer` | `Σ parcelas` `NOT recebido AND mes_esperado > fim_mes` |
| `a_receber_total` | `a_receber_vencido + a_receber_a_vencer` |
| `inadimplencia` | `= a_receber_vencido` |
| `balanco.caixa` | `= saldo_acumulado(ano, mes)` from `ind_fluxo_mensal` — one definition, not a parallel one |
| `balanco.ativo` | `caixa + a_receber_total` — **overdue receivables included**; they are still assets |
| `analise.faturamento` | `= dre.receita` (`entradas_pagas` of the month). Materialized separately only so `/analises/mes` is a single-row read; **it is the same number**, and TEST-CALC-17 asserts the two never diverge |
| `gastos_categoria.total` | `Σ valor` — paid exits of the month, grouped by `categoria` |
| `balanco.passivo` | `Σ` **unpaid** `lancamentos` `tipo='saida'` with `data <= fim_mes` |
| `balanco.patrimonio_liquido` | `ativo − passivo` |
| `clientes_fechados` | `count(contratos)` with `data_fechamento` within the month |
| `restituicoes` | `Σ` paid exits, category `restituicao_cliente`, within the month |
| `custo_fixo_mensal` | `Σ valor_mensal` of `custos_fixos` **in force** at `fim_mes`: `mes_inicio <= fim_mes AND (mes_fim IS NULL OR mes_fim >= fim_mes)`; `recorrente = true` rows only |
| `meses_reserva` | `caixa_atual / NULLIF(custo_fixo_mensal,0)` |
| `percentual_receita_recorrente` | `receita_recorrente_ano / NULLIF(receita_ano,0)`, where **both draw on `lancamentos`** (never on `parcelas`): `receita_ano` = Σ paid entries with `data` in `ano`; `receita_recorrente_ano` = the subset whose `origem='parcela'` and whose source `parcela.tipo='mensal'`. Same population in numerator and denominator, so the ratio cannot exceed 1 |
| `percentual_meta_caixa` | `caixa_atual / NULLIF(parametros.meta_caixa_ano,0)` |
| `percentual_meta_recorrencia` | `parametros.recorrencia_atual / NULLIF(parametros.meta_recorrencia_mensal,0)` |
| `taxa_conversao` | `count(status IN ('ativo','aguardando_exito','encerrado')) / NULLIF(count(*),0)`, over contracts whose **`data_proposta` falls in `ano`** |
| `exito_projetado_escritorio` | `Σ valor_causa × percentual_exito × (1 − percentual_quota)` over contracts with `status IN ('ativo','aguardando_exito')` — **open contracts only**; including `encerrado`/`sem_exito` would inflate the projection with settled matters |
| `exito_projetado_parceiro` | same population, `× percentual_quota` |
| `sucumbencia_projetada` | `Σ valor_causa × percentual_sucumbencia`, same population |

`saldo_acumulado` is the chain whose manual overwrite broke the original spreadsheet. There is no
column anywhere a user can write a monthly balance into. `NULLIF` guards every ratio — an office
with zero proposals renders `—`, not a crash; the corresponding columns are nullable by design.

**Two asymmetries deliberately removed** relative to a naive reading: overdue receivables stay in
`ativo` (excluding them while counting all unpaid exits in `passivo` would systematically understate
equity for a firm carrying real inadimplência), and both `caixa_atual` and `taxa_conversao` are
year-scoped so they remain correct in year two.

## 6. Recalculation strategy

`recalcular_mes(ano, mes)` — `SECURITY DEFINER`, rewrites `ind_fluxo_mensal`, `ind_dre_mensal`,
`ind_balanco`, `ind_analise_mensal` and `ind_gastos_categoria` for that month, then re-chains
`saldo_acumulado` for **subsequent months only**, then refreshes `ind_painel`.

**Which month(s) a trigger resolves to** — a single-month call is wrong for three of the five fact
tables, so the rule is stated per table rather than left to inference:

| Fact table | Months to recalculate |
|---|---|
| `lancamentos` | month of `data`; on UPDATE, **both** OLD and NEW months |
| `parcelas` | month of `mes_recebimento` (fallback `mes_esperado` when unreceived); on UPDATE, both |
| `contratos` | months of OLD **and** NEW `data_fechamento` — moving a closing from March to September must fix both months' `clientes_fechados`, not just one |
| `custos_fixos` | **every** month in `[mes_inicio, COALESCE(mes_fim, end of current year)]`, for OLD and NEW windows — a validity-window edit changes `custo_fixo_mensal` across a range, possibly spanning years |
| `parametros` | **all 12 months** of `ano` — `caixa_inicial_ano` seeds the whole chain |

`recalcular_meses(ano, mes_de, mes_ate)` is the range form; the single-month call is a thin wrapper.
When a `custos_fixos` window spans years, it is invoked once per affected year.

### 6.1 Two classes of report table — and why only one rolls with the calendar

This distinction resolves an otherwise irreconcilable pair of requirements:

| Class | Tables | As-of | Refresh |
|---|---|---|---|
| **Historical** | `ind_fluxo_mensal`, `ind_dre_mensal`, `ind_balanco`, `ind_analise_mensal`, `ind_gastos_categoria` | the row's own `(ano, mes)` | **Facts only.** Given the same facts, these values are permanent — March's DRE never changes because it became April. |
| **Point-in-time** | `ind_painel` | `mes_referencia` | Facts **and** a monthly call to `refresh_painel()` |

`ind_painel` is a dashboard of *now*: "how many months of reserve do I have" must move forward with
the calendar even when nothing was typed. The month-keyed tables must **not** — that is exactly what
TEST-CALC-10 protects.

So **TEST-CALC-10 applies to the five historical tables and explicitly exempts `ind_painel`**, and
TEST-CALC-19 covers `ind_painel`'s rollover. Without this split the two tests contradict each other:
one demands nothing changes at a month boundary, the other demands `mes_referencia` advances.

**Where each piece lives:** `refresh_painel()` is a plain SQL function and ships in the **Phase-2
calculation migration** (T-026), so it exists on local Postgres and TEST-CALC-19 can gate GATE-CALC
on the local stack, which is where every phase is verified. Only its **schedule**
(`cron.schedule('refresh-painel', ...)`) lives in the Supabase-only `011_watchdog.sql` (T-049b).
Splitting them this way keeps a Phase-2 gate from depending on a Phase-4 artifact.

`refresh_painel()` also rewrites the **prior** year's row to `mes_referencia = 12` when a year
boundary passes, so a closed year settles on a December view rather than freezing mid-year.

> This is the one place where a stored value legitimately depends on the clock. DEC-32's rule —
> formulas evaluate as of a reference month, never `current_date` — still holds: the formulas
> consume `mes_referencia`; only the *choice* of `mes_referencia` looks at the calendar, in exactly
> one function.

Invoked by `AFTER INSERT OR UPDATE OR DELETE` triggers on `lancamentos`, `parcelas`, `custos_fixos`,
`contratos`, `parametros` — inside the same transaction as the fact change (DEC-03), so the fact and
its indicator commit together or not at all.

**Concurrency:** `recalcular_mes()` takes `pg_advisory_xact_lock(hashtext('recalc:'||ano||':'||mes))`
as its first statement. Two transactions touching the same month serialize instead of interleaving
their rewrites of the same `ind_*` rows.

**`atualizado_em`** on `contratos`, `parametros` and `configuracoes` is maintained by a shared
`BEFORE UPDATE` trigger (`set_atualizado_em()`). With `DEFAULT now()` alone it would hold the insert
timestamp forever and quietly misreport freshness.

**Scoping:** editing a January entry re-chains Jan→Dec (12 months), not the full history. Editing
December touches one month. Cost stays bounded as history grows. A changed `caixa_inicial_ano`
re-chains that year only.

**The consistency invariant, tested (TEST-CALC-07):** for any month,
`materialized value == value recomputed from scratch from the facts`. This is the test that keeps
materialization from re-opening the very defect it replaced.

## 7. Volume and indexing

~106 processes, ~50–200 contracts, single-digit thousands of entries per year. This is small data;
correctness dominates. Indexes above target the three hot paths: month-scoped entry aggregation
(`ix_lanc_competencia`), open instalments (`ix_parcelas_abertas`), and radar process selection
(`ix_processos_radar`). No partitioning, no read replicas — proposing either would be over-engineering
at this scale.
