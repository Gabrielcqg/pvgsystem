# 21 — Test & Validation Plan

Every acceptance criterion maps to a test. The scraper battery is **fixture-driven against static
HTML** via `analisar_html()` (DEC-18) — no browser, no network, fully deterministic.

> **Canonical test IDs.** The readable names below (`TEST-RADAR-01`, `TEST-CALC-07`, …) are the
> working vocabulary. The machine-readable artifacts use the numeric form required by
> `system-building-os/schemas/acceptance-criteria.schema.json` (`^TEST-[0-9]{3,}$`). The one-to-one
> mapping is `TEST-ID-MAP.json` — 101 entries, generated, not hand-maintained. `EVID-01` maps to
> `TEST-101`.

---

## 1. Scraper battery (the document's required list, plus what real runs exposed)

Fixtures are captured from `debug_tjsp/*.html` and the validated run, anonymized.

| ID | Case | Expected |
|---|---|---|
| TEST-RADAR-01 | First query for a process | `base_inicial_criada`, `tem_movimentacao_nova=false`, baseline stored |
| TEST-RADAR-02 | No new movement | `sucesso`, `tem_movimentacao_nova=false`, baseline unchanged |
| TEST-RADAR-03 | One new movement | `tem_movimentacao_nova=true`, 1 row in `movimentacoes_novas` |
| TEST-RADAR-04 | Three different movements | 3 rows queued, baseline fully replaced |
| TEST-RADAR-05 | Process not found | `nao_localizado`, baseline untouched |
| TEST-RADAR-06 | Password required | `senha_necessaria`, `exige_senha=true`, no password persisted |
| TEST-RADAR-07 | Captcha timeout | `captcha_timeout`, run continues to next process |
| TEST-RADAR-08 | Unexpected failure | `erro` with `tipo_erro`, run continues |
| TEST-RADAR-09 | Interruption mid-run | Completed processes persisted; run reaped to `interrompida` |
| TEST-RADAR-10 | Two simultaneous runs | Second gets **409**; advisory lock held |
| TEST-RADAR-11 | **Timeout must not advance the inertia clock** | `data_ultimo_andamento` unchanged, `ultima_consulta_inconclusiva=true`, **no inertia task created** (DEC-19) |
| TEST-RADAR-12 | Process deletion | Process + results + queued movements gone; tasks survive with `numero_processo` intact |
| TEST-RADAR-13 | Secure password registration | Vault holds it; DB holds only `senha_ref`; response/audit/log contain no value |
| TEST-RADAR-14 | Manual run | Records triggering user, `origem='manual'` |
| TEST-RADAR-15 | Scheduled run | `origem='agendada'`, `usuario_id` null |
| TEST-RADAR-16 | **Reserved slot** (TJCE/TJBA) | `pendente_implementacao`, run does not fail, counter increments (DEC-15) |
| TEST-RADAR-17 | **Both layouts extract identically** | `eproc_eventos` and `container_movimentacao` fixtures yield equivalent `Movimentacao` sets (DEC-17) |
| TEST-RADAR-18 | Key determinism | Same movement with padding/newline/accent variation → identical `chave` |
| TEST-RADAR-19 | Timeout must not clear a baseline | Baseline intact after `timeout`; next success reports only genuinely new movements |
| TEST-RADAR-20 | Email send fails | Logged; **run still completes** — a broken SMTP must never fail the radar |
| TEST-RADAR-21 | Run status classification | `total_erro>0` or `taxa_conclusiva`<0.70 → `falhou_parcialmente`; clean → `concluida`; stale heartbeat → `interrompida` |
| TEST-RADAR-22 | Error email content | Carries process number, status, message, **etapa**, timestamp — and no password |
| TEST-RADAR-23 | Missing-run alert | Fires when no `concluida` run within the configured days; **runs off-host** (DEC/§8) |
| TEST-RADAR-24 | Invalid tribunal cannot be stored | `tribunal_sigla` enum rejects `TJ-SP`; no silent permanent `pendente_implementacao` |
| TEST-RADAR-25 | Invalid CNJ number rejected at the endpoint | `ck_numero_cnj` + 422; never consumes a browser slot |
| TEST-RADAR-30 | **Telemetry alerts fire** (FR-41, FR-42) | `captcha_timeout` > 20% raises the captcha alert; `taxa_conclusiva` < 0.70 raises the degradation alert; a healthy run raises neither |
| TEST-RADAR-32 | **Process seed loads** (FR-49) | 118 rows from `vendor/seed/processos_seed.csv`; 117 inserted; the `valido=false` row is rejected by `ck_numero_cnj`, reported, and does not abort the seed |
| TEST-RADAR-31 | **Full run with 12 pending finishes `concluida`** (FR-45) | 106 TJSP + 12 TJCE/TJBA: run is `concluida`; pending excluded from `taxa_conclusiva`, error email, inertia and alerts; baselines untouched |

TEST-RADAR-17 and -19 exist because both are silent-corruption paths: a collapsed layout handler
breaks ~40% of queries while still "passing", and a cleared baseline makes the following run report
the whole window as new, flooding the curation queue.

| TEST-DOC-01 | **Documentation delivered** (FR-52) | `README.md` documents setup, the local stack and the run report; `docs/evidence/` contains the EVID-01 record; deviation report present |
| TEST-ARCH-01 | **Scraper imports no DB module** (NFR-10) | CI import-graph assertion over `radar/scrapers/**`: zero imports of any database/ORM/Supabase module |
| TEST-SCRAPER-01 | **Canonical file is unmodified** | `sha256(vendor/scraper/consulta_tjsp_lote.py)` == `c9429f2a…` — CI fails on any byte change (`GATE-SCRAPER-FROZEN`) |
| TEST-SCRAPER-02 | **`eproc_eventos` branch intact** | `analisar_html()` over the 2 eproc fixtures matches `golden-extraction.json` exactly |
| TEST-SCRAPER-03 | **`container_movimentacao` branch intact** | `analisar_html()` over the 3 container fixtures matches `golden-extraction.json` exactly |

### 1.1 Password submission — the one path that needs a browser

The battery above is fixture-driven (DEC-18). Password **submission** and debug-artifact suppression
are inherently live-DOM behaviors and cannot be proven by static HTML. They get their own tier:

| ID | Case | Method | Expected |
|---|---|---|---|
| TEST-RADAR-26 | `submeter_senha()` fills and resubmits | Local HTML fixture served over `file://`, driven by a real browser | Field located, form submitted |
| TEST-RADAR-27 | **A process with a registered password succeeds on the next run** — the actual FR-21/FR-39 requirement | Live browser against a stub portal | `senha_necessaria` → `sucesso` |
| TEST-RADAR-28 | Debug artifacts suppressed for password-bearing processes | Live browser | No HTML/PNG written for that process |
| TEST-RADAR-29 | **A newly registered process is not queried immediately** (FR-29) | Service-level — **no browser needed**, runs in the fixture tier | `POST /processos` triggers no query; the process appears in the **next** run |

These run in a separate, browser-marked suite (`pytest -m browser`) so the fast fixture suite stays
browser-free. Without this tier, FR-21's "becomes queryable after registration" would be entirely
unverified — TEST-RADAR-06 and -13 only cover detection and storage.

## 2. Transactional links

| ID | Case | Expected |
|---|---|---|
| TEST-TX-01 | Confirm instalment | Instalment received **and** entry created, one transaction |
| TEST-TX-02 | Reverse instalment | Both sides undone atomically |
| TEST-TX-03 | Entry settling an instalment | Same end state as TEST-TX-01 |
| TEST-TX-04 | Failure mid-transaction | Full rollback — never an instalment received without its entry |
| TEST-TX-05 | Double confirmation | **409** via `ux_lanc_origem` |
| TEST-TX-06 | Fixed cost twice in one month | **409** via `ux_lanc_origem` composite key |
| TEST-TX-07 | Movement → task twice | **409** via `ux_tarefa_movimentacao` |
| TEST-TX-08 | Inertia rule twice on same process | Exactly one open task via `ux_tarefa_inercia_aberta` |
| TEST-TX-09 | Delete contract holding instalments | **409** without `cascade`; clean removal with it |
| TEST-TX-10 | **Fixed cost posted to cash** | Entry created with correct date/description/category; `pago=false` |
| TEST-TX-11 | Fixed cost outside `[mes_inicio, mes_fim]` | **422** |
| TEST-TX-12 | `dia_vencimento=31` in a 30-day month | Clamps to the 30th; no invalid-date error |
| TEST-TX-13 | Non-recurrent cost posted twice | **422** on the second month |
| TEST-TX-14 | Late instalment confirmation | Entry and recalculation land in the **received** month, not the expected one |
| TEST-TX-15 | Partner cannot be deleted while referenced | FK RESTRICT → 409 (this is what FR-01 actually asserts) |
| TEST-TX-16 | Contract status transition | Moving between phases is a status change; the contract keeps its identity and instalments |

### 2.1 Audit content

TEST-SEC-02 proves the trail is immutable. These prove it is *written* — otherwise DEC-07's
"audit from day one" is unverified.

| ID | Case | Expected |
|---|---|---|
| TEST-AUD-01 | Value edit | Row written with `usuario_id`, `valor_antigo`, `valor_novo` |
| TEST-AUD-02 | Instalment confirm / reverse | Both audited |
| TEST-AUD-03 | Contract status change | Old and new status recorded |
| TEST-AUD-04 | Process deletion | Audited, and the row **survives** the cascade |
| TEST-AUD-05 | **Password registration** | Audited as an event with **no value**, and redaction verified |
| TEST-AUD-06 | Run triggered | Audited with the triggering user |

## 3. Derived calculations

| ID | Case | Expected |
|---|---|---|
| TEST-CALC-01 | `caixa_atual` | `caixa_inicial + Σ paid entries − Σ paid exits` |
| TEST-CALC-02 | Monthly chain | Each month seeds from the previous; no constant in the middle |
| TEST-CALC-03 | DRE | Revenue − direct costs − opex; margin derived |
| TEST-CALC-04 | Balance sheet | Equity closes by difference, exactly |
| TEST-CALC-05 | Default / receivable | Correct split at the **reference-month** boundary (`fim_mes`), never `current_date` (DEC-32) |
| TEST-CALC-06 | Projected success split | Office `× (1−quota)`, partner `× quota` (**DEC: quota is the partner's share**) |
| **TEST-CALC-07** | **Materialization invariant** | After any primary-fact change, the materialized value equals a from-scratch recomputation, in the same transaction |
| TEST-CALC-08 | Scoped recalculation | Editing month N rewrites N..12 only, not prior months |
| TEST-CALC-09 | Zero-division guards | Zero proposals / zero revenue / zero fixed cost → NULL, never a crash |
| TEST-CALC-10 | **Month rollover changes nothing** — for the **five historical tables** (`ind_fluxo_mensal`, `ind_dre_mensal`, `ind_balanco`, `ind_analise_mensal`, `ind_gastos_categoria`); **`ind_painel` is exempt** (07 §6.1) | Advance the clock past a month boundary with no fact change; every historical value is unchanged and TEST-CALC-07 still holds (DEC-32) |
| TEST-CALC-11 | Overdue receivables stay in `ativo` | An overdue instalment appears in `a_receber_vencido` **and** in `ativo` (DEC-33) |
| TEST-CALC-12 | Year scoping | Year 2 `caixa_atual` does not double-count year 1; conversion counts only that year's proposals |
| TEST-CALC-13 | Four derived indicators | `meses_reserva`, `% receita recorrente`, `custo_fixo_mensal`, `% meta` match hand-computed cases |
| TEST-CALC-14 | Projection population | Only `ativo`/`aguardando_exito` contracts feed projected success; `encerrado`/`sem_exito` excluded |
| TEST-CALC-15 | `custo_fixo_mensal` window | Costs outside `[mes_inicio, mes_fim]` and `recorrente=false` are excluded |
| TEST-CALC-16 | Recalculation concurrency | Two concurrent writes to the same month serialize; no lost update on `ind_*` |
| TEST-CALC-17 | `analise.faturamento` == `dre.receita` | The two materialized copies never diverge |
| TEST-CALC-18 | Multi-month trigger resolution | Moving `data_fechamento` March→September recalculates **both**; a `custos_fixos` window edit recalculates the whole range; a `parametros` change recalculates all 12 |
| TEST-CALC-19 | `ind_painel` rollover | `refresh_painel()` advances `mes_referencia` at a month boundary and settles a closed year to 12; the as-of values keyed to it agree (07 §6.1) |

**TEST-CALC-07 is the keystone.** It is the test that proves materialization did not re-open the
spreadsheet defect. It must run against every report table and every mutating operation.

### 3.1 Performance

| ID | Case | Expected |
|---|---|---|
| TEST-PERF-01 | Read-endpoint latency (NFR-03) | `GET /painel` and `GET /fluxo-caixa` **p95 < 300 ms** against a seeded year — the whole point of materializing |

## 4. RLS & security

| ID | Case | Expected |
|---|---|---|
| TEST-RLS-01 | Anonymous user | Cannot read or write **any** table |
| TEST-RLS-02 | Authenticated user | Exactly the intended access |
| TEST-SEC-01 | Write to `ind_*` | Denied — no grant exists (DEC-04) |
| TEST-SEC-02 | Update/delete `auditoria` | Denied by absent policy **and** by trigger |
| TEST-SEC-03 | **Password redaction across all five channels** | Absent from logs, API responses, error email, audit values, and debug HTML/PNG |
| TEST-SEC-04 | `senha_ref` never holds a secret | Only a `vault:<uuid>` reference |
| TEST-SEC-05 | **API does not connect as `service_role`** | A handler attempting an `ind_*` write is denied by RLS — proves the control is live, not revoked on an unused role (DEC-28) |
| TEST-SEC-06 | **Radar-owned columns rejected on PATCH** | `chaves_movimentacoes`, `data_ultimo_andamento`, `senha_ref` → 422, not silently ignored (DEC-34) |
| TEST-SEC-07 | **`radar_worker` is confined** | Connected as `radar_worker`: `ind_*` and financial tables denied; `auth.*` denied; `INSERT tarefas` with `origem <> 'radar_inercia'` denied; radar tables writable (09 §3.1) |
| TEST-SCHEMA-01 | Unknown honorarium spelling | Enum rejects it — the closed vocabulary works without the loader |
| TEST-SCHEMA-02 | Instalment with null/unknown contract | Rejected by NOT NULL + FK |
| TEST-CFG-01 | Schedule is configurable | Changing `radar_cron` changes the next run; no deploy |
| TEST-CFG-02 | Email recipient is configurable | Changing `radar_email_erros` redirects the report |
| TEST-CFG-03 | **`AWS_REGION` validation** (FR-46) | Default `sa-east-1`; an out-of-allowlist value fails startup with a clear message |
| TEST-CFG-04 | **Local stack needs no region/Supabase config** (FR-47) | Migrations `000`–`010` apply to a bare Postgres container; full suite green with `AWS_REGION` unset |

TEST-SEC-03 asserts all five channels in one test because closing four of five is equivalent to
closing none.

## 5. Spreadsheet loader (**not deferred** — runs against synthetic fixtures, DEC-37)

| ID | Case | Expected |
|---|---|---|
| TEST-LOAD-01 | Idempotency | Re-running duplicates nothing |
| TEST-LOAD-02 | Vocabulary normalization | Divergent spellings collapse to the right enum; each decision logged |
| TEST-LOAD-03 | Orphan instalments | Reconciled; missing contracts recreated and flagged for review |
| TEST-LOAD-04 | Cash chain | Recomputed from entries, discarding the hand-typed balances |
| TEST-LOAD-05 | `--validate-only` dry-run | Reports bindings/unmapped values/warnings and **writes nothing** |
| TEST-LOAD-07 | `import_log` is written and insert-only | Every mapping/creation/warning produces a row; UPDATE and DELETE are denied |
| TEST-LOAD-06 | Header alias resolution | `Descrição`/`DESCRICAO`/`descrição ` all bind to `descricao`; an unbindable required header is a hard error naming the available headers |

**Not blocked.** All six run against `tests/fixtures/planilhas/*.xlsx`, generated by the plan with
hand-computed expected values in `esperado.json`. The real workbooks change the data, not the contract.

## 6. Gates

| Gate | Meaning | State at end of planning |
|---|---|---|
| `GATE-SCHEMA` | Migrations rebuild the DB from zero | PENDING |
| `GATE-RLS` | Every table has RLS + tested policies | PENDING |
| `GATE-TX` | Three links proven atomic | PENDING |
| `GATE-CALC` | TEST-CALC-07 green on all report tables | PENDING |
| `GATE-SCRAPER-FROZEN` | Vendored core's navigation/layout/extraction/recovery unchanged | PENDING |
| `GATE-RADAR` | Full battery green | PENDING |
| `GATE-SECRETS` | No secret in logs, responses, email, audit, or debug artifacts | PENDING |
| `GATE-DOCS` | README + run report + evidence index present | PENDING |
| `GATE-LOAD` | Loader idempotent + auditable against synthetic fixtures (TEST-LOAD-01…07) | PENDING |
| `GATE-PROD-RUN` | One real end-to-end run on the deployment host | PENDING |

All implementation gates are **PENDING** and stay so until Codex proves them.

`GATE-PROD-RUN` is required because the 88.7% baseline was measured on the office Mac at 01:49.
If deployment moves to a VPS (DEC-23), the datacenter IP is an unproven variable for captcha
behavior — the gate is what would catch that before it becomes a silently broken weekly radar.
