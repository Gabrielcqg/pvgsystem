# 23 — Task Decomposition

> **plan_audit 2026-07-21 (commit 7be04107): Phases 0–6 are ALREADY IMPLEMENTED and applied to Supabase.**
> Codex **verifies they are present and does not rebuild them**; the migration source is
> `supabase/migrations/` (timestamped), the legacy `migrations/000-011` dir is removed, and no applied
> migration may be duplicated. **Only Phase 7 (backend-completion of genuinely-missing endpoints + JWKS
> rework + frontend) is new build work.** See `runtime/60-repo-reconciliation.md`.

Vertical slices where possible, so value becomes provable early. Foundation work stays horizontal.

---

## Phase 0 — Preserve what exists (do this first)

| ID | Task | Why first |
|---|---|---|
| **T-004** | **Characterization tests against the already-versioned canonical scraper** — TEST-SCRAPER-01 (hash pin), TEST-SCRAPER-02 (`eproc_eventos` golden), TEST-SCRAPER-03 (`container_movimentacao` golden) | **This is the first task.** The scraper and its fixtures are already in `vendor/` (DEC-39). Without these tests `GATE-SCRAPER-FROZEN` is unenforceable and "we didn't change extraction" is a claim, not a fact. |
| T-001 | Create the product repo; copy `vendor/` in as `radar/scrapers/vendor/` + `tests/fixtures/scraper/`, preserving hashes | Provenance is already recorded in `vendor/PROVENANCE.md`; **do not re-derive it from Downloads** |
| T-002 | `docker compose` local stack (Postgres 16) — the environment every phase is verified on | Removes any dependency on EXT-DEP-01 |
| T-003b | **`pyproject.toml` with the 11 pytest markers** (`scraper, config, arch, schema, calc, api, radar, security, e2e, loader, browser`) — every task's validation command depends on it | Without it the very first validation command in the plan is unrunnable |
| T-003 | Pin dependencies (`vendor/scraper/requirements.txt` is the starting point), `.env.example` with **names only**, and `app/config.py` with the validated `AWS_REGION` (FR-46, DEC-35) | Reproducibility; removes any region dependency from every later phase |
| T-005 | CI import-graph assertion (NFR-10: `radar/scrapers/**` imports no DB module) | Mechanizes NFR-10 |

**T-004 runs first**, against `vendor/` **in this package** — the frozen scraper and its golden
fixtures are already here, so characterization needs no product repo. Its tests are written to **`tests/scraper/**` in the product
repo skeleton created by T-001's `git init`**, which T-004 performs inline before writing — the
repo shell is trivial; what T-001 owns is copying the *vendored tree* in, and that must not precede
characterization. T-001 then copies that tree in,
and the TJSP adapter tasks (T-040, T-041) depend on T-004, so `GATE-SCRAPER-FROZEN` is enforced by
the dependency graph and not merely by document order.

## Phase 1 — Schema foundation

| ID | Task | Deliverable |
|---|---|---|
| **T-009** | **Bootstrap: `pgcrypto`; local-only stub `auth` schema + `auth.users` + `authenticated` role, all `IF NOT EXISTS`** (DEC-30)  | (applied in `supabase/migrations/` — VERIFY present, do not rebuild) |
| T-010 | Enums (incl. `tribunal_sigla`) + `parceiros` seeded | (applied in `supabase/migrations/`), (applied in `supabase/migrations/`) |
| T-011 | `contratos`, `parcelas` + constraints + `revisar` columns + `set_atualizado_em()` trigger  | (applied in `supabase/migrations/` — VERIFY present, do not rebuild) |
| T-012 | `lancamentos`, `custos_fixos`, `parametros`, `configuracoes` + `ux_lanc_origem`  | (applied in `supabase/migrations/` — VERIFY present, do not rebuild) |
| **T-013** | **Radar tables** (`processos`, `execucoes_radar`, `resultados_consulta`, `movimentacoes_novas`)  | (applied in `supabase/migrations/` — VERIFY present, do not rebuild) |
| **T-014** | **`tarefas`** + both idempotency indexes — **after radar** (DEC-29: it FKs `movimentacoes_novas` and `processos`)  | (applied in `supabase/migrations/` — VERIFY present, do not rebuild) |
| T-015 | `auditoria` **+ `import_log`** + insert-only triggers + redaction  | (applied in `supabase/migrations/` — VERIFY present, do not rebuild) |
| T-016 | All six `ind_*` tables with full columns + `REVOKE` writes  | (applied in `supabase/migrations/` — VERIFY present, do not rebuild) |
| T-017 | RLS enabled + policies for **every** table incl. `import_log` (insert-only)  | (applied in `supabase/migrations/` — VERIFY present, do not rebuild) |
| **T-019** | **`CREATE ROLE radar_worker` + scoped GRANTs + policies `TO radar_worker`** (09 §3.1) — without it the worker is denied by RLS and the orchestrator cannot run at all  | (applied in `supabase/migrations/` — VERIFY present, do not rebuild) |
| T-018 | **Verify** the applied `supabase/migrations/` schema + RLS are present (already applied — do NOT rebuild); run TEST-RLS-01/02 | **GATE-SCHEMA**, **GATE-RLS** |

> **T-013 before T-014 is not cosmetic.** `tarefas.movimentacao_id` and `tarefas.processo_id`
> reference radar tables. The reverse order aborts the first clean rebuild with
> `relation "movimentacoes_novas" does not exist`.

## Phase 2 — Calculation engine

| ID | Task |
|---|---|
| T-020 | `recalcular_mes()` — fluxo, DRE, balanço |
| T-021 | Monthly chaining seeded from `caixa_inicial_ano` |
| T-022 | `ind_painel` aggregation incl. projected success split (quota = partner) |
| T-023 | Triggers on all five fact tables, in-transaction |
| T-024 | **TEST-CALC-01..19**, especially TEST-CALC-07 (invariant), TEST-CALC-10 (historical tables unchanged) and TEST-CALC-19 (`ind_painel` rollover) | **GATE-CALC** |
| T-025 | `recalcular_meses(ano, mes_de, mes_ate)` range form + per-table trigger month resolution (07 §6) | TEST-CALC-18 |
| T-026 | `refresh_painel()` + its monthly schedule (07 §6.1) | TEST-CALC-19 |

## Phase 3 — Vertical slice: contracts → instalments → cash

| ID | Task |
|---|---|
| T-030 | CRUD contratos + parceiros (+ audit) |
| T-031 | CRUD parcelas; contract deletion policy with 409/cascade |
| T-032 | CRUD lançamentos with scoped recalculation |
| T-032b | **`GET /parametros/:ano`, `PUT /parametros/:ano`** — the only 4 configuration numbers (FR-10) | TEST-CALC-02 |
| T-033 | **Link 1**: confirm/reverse instalment, transactional |
| T-034 | **Link 2**: entry with optional instalment settlement |
| T-035 | Fixed costs + monthly posting with idempotency key |
| T-037b | TEST-PERF-01 (NFR-03 latency budget) — gated with the read endpoints it measures |
| T-036 | Read endpoints: painel, fluxo, DRE, balanço, análises — **field names reconciled against `vendor/frontend/FRONTEND_REFERENCE_PAVAGEAU.md`** (vendored, DEC-40) before freezing |
| T-037 | **`GET /configuracoes`, `PUT /configuracoes/:chave`** (FR-30, FR-31) |
| T-038 | Write/response allowlists on every endpoint (DEC-34) |
| T-039 | **TEST-TX-01..16**, TEST-SCHEMA-01/02, TEST-CFG-01/02, **TEST-AUD-01..06** | **GATE-TX** |

## Phase 4 — Radar

| ID | Task |
|---|---|
| T-040 | `ScraperTribunal` protocol + registry with **TJCE/TJBA slots reserved** (DEC-15) |
| T-041 | TJSP adapter wrapping the frozen core |
| T-042 | Deterministic key + baseline comparison (reusing `chave_texto`) |
| T-043 | Orchestrator: advisory lock, incremental persistence, per-process isolation |
| T-044 | `pendente_implementacao` path for reserved slots |
| T-045 | Vault + `PUT /processos/:id/senha` |
| T-046 | `submeter_senha()` — **additive function only** (DEC-20) |
| T-047 | Inertia rule: 30 days, idempotent, **successes only** (DEC-19) |
| T-048 | **Link 3**: movement → task |
| T-049 | Weekly scheduler reading `configuracoes.radar_cron` + `POST /radar/executar` |
| T-049b | **Missing-run watchdog off-host**: `pg_cron` → `pg_net` → Edge Function → email (§8 integration plan) |
| T-050 | Technical error email — redacted, configurable recipient, carries **etapa** (FR-32) |
| T-051 | Radar read endpoints |
| T-051c | **Processos CRUD incl. `DELETE /processos/:id`** — permanent removal cascading run history (FR-26, DEC-08) | TEST-RADAR-12 |
| T-051b | **Seed `processos` from `vendor/seed/processos_seed.csv`** (118 rows: 106 TJSP · 7 TJCE · 5 TJBA). The 1 row flagged `valido=false` is reported and skipped, not force-inserted. Required before `GATE-PROD-RUN`/EVID-01. | TEST-RADAR-32 |
| T-052 | **TEST-RADAR-01..25 + TEST-RADAR-29** (fixture/service tier) | **GATE-RADAR**, **GATE-SCRAPER-FROZEN** |
| T-053 | **TEST-RADAR-26..28** (browser tier, `pytest -m browser`) — password submission + artifact suppression; **TEST-RADAR-29 is service-level and belongs to T-052** | **GATE-SECRETS** |

## Phase 5 — Hardening

| ID | Task |
|---|---|
| T-060 | Redaction across all five leak channels, incl. **suppressing debug artifacts for password-bearing processes** |
| T-061 | **TEST-SEC-01..07**, TEST-RLS-01..02 — incl. TEST-SEC-05 (API is not `service_role`) and TEST-SEC-06 (radar-owned columns rejected) | **GATE-SECRETS** |
| T-062b | **`notificacao.py` alert delivery for FR-41/FR-42** — captcha-rate and degradation alerts through the error-report mail path (`app/radar/**`) | TEST-RADAR-30 |
| T-062 | Radar telemetry **and its two alerts**: `captcha_timeout` rate > 20% and `taxa_conclusiva` < 0.70, delivered through the same mail path as the error report (FR-41, FR-42) | TEST-RADAR-30 |
| T-063 | End-to-end run on the deployment host | **GATE-PROD-RUN** |
| T-064 | **README + run report + evidence index** (`docs/**`) — satisfies `documentation_complete` and `deviation_report_complete` | — |

## Phase 6 — Spreadsheet load (**not blocked**)

Built and completed against synthetic fixtures (`19-spreadsheet-import-contract.md` §5). The real
workbooks are a later **data operation** (§6), not a development dependency.

| ID | Task | Test |
|---|---|---|
| T-069 | `gerar_sinteticas.py` — generate both workbooks reproducing every known defect + `esperado.json` | — |
| T-070 | `COLUMN_ALIASES` mapping table + two-pass header resolution (reusing `chave_texto()`) | TEST-LOAD-06 |
| T-071 | Idempotent, auditable loader with vocabulary normalization + `import_log` | TEST-LOAD-01, -02 |
| T-072 | Reconcile orphan instalments; auto-create missing contracts/partners, flagged `revisar` | TEST-LOAD-03 |
| T-073 | Recompute the cash chain, discarding typed balances; report per-month delta | TEST-LOAD-04 |
| T-074 | `--validate-only` dry-run mode (the §6 step-2 gate) | TEST-LOAD-05 |

## Dependencies

```
Phase 0 ──► Phase 1 ──► Phase 2 ──► Phase 3 ──► Phase 5 ──► Phase 6
                   └──► Phase 4 ──────────────►

(no phase is blocked; EXT-DEP-01 gates production APPLY only, after Phase 5)
```

Phases 3 and 4 are parallelizable after Phase 2: disjoint file ownership
(`app/domain/*` + `app/reports/*` vs `app/radar/*`).

**Blocking: none.** Every phase, including 6, completes on the local stack. `AWS_REGION` is validated
configuration with a default (DEC-35) and is unread locally. EXT-DEP-01 gates only the production
*apply* and `GATE-PROD-RUN`.

## Phase 7 — Frontend & integration (vertical slices; tests per slice)

| ID | Task | Test |
|---|---|---|
| T-BE-1 | **ADDITIVE endpoints only** (runtime/62 §2 — CRUD already exists via `_collection_routes`; do NOT recreate): `GET /me`, `POST /radar/executar`, `GET /radar/execucoes\|/{id}\|/ultima\|/movimentacoes-novas`, `GET /auditoria`, `GET /contratos/{id}`; thin wrappers over existing services (FR-67) | TEST-FE-BE |
| T-BE-2 | **DONE (commit af9c5d3)** — ES256/JWKS + HS256 compat implemented in `app/db/session.py`; VERIFY present, do not rebuild (FR-68) | TEST-FE-JWKS |
| T-FE-01 | FS-1 Fundacao + Auth (**reproduzir pavageau_v2.jsx fielmente, runtime/63; preservar lib/api.js, lib/supabase.js e as telas de login/reset aprovadas; substituir o App.jsx gigante por componentes por view**): Vite/React/TS, design system+tokens, Supabase Auth (login/set-password/reset), **JWKS backend rework fail-closed**, `GET /me`, guards, api client, not-authorized (FR-53,54,55,56,68,69) | TEST-FE-F01 |
| T-FE-02 | FS-2 Painel: `/painel` + CalculatedValue read-only, dashboard real (FR-57,71) | TEST-FE-CALC |
| T-FE-03 | FS-3 Contratos & Parcelas: `/parceiros`,`/contratos` CRUD + detalhe, confirmar/estornar (FR-58,59,67) | TEST-FE-F16 |
| T-FE-04 | FS-4 Lancamentos & Fluxo: `/lancamentos` CRUD + quitacao, `/custos-fixos` CRUD + lancar, fluxo read (FR-60,61,67) | TEST-FE-F19 |
| T-FE-05 | FS-5 Analises & Indicadores: `/analises/mes`,`/dre`,`/balanco` read-only com freshness (FR-57) | TEST-FE-CALC |
| T-FE-06 | FS-6 Tarefas: `/tarefas` CRUD + concluir + criar de movimentacao (FR-62,67) | TEST-FE-F21 |
| T-FE-07 | FS-7 Radar & Processos: `/processos` CRUD, `/radar/*`, estados distintos, aguardando scraper, senha (FR-63,64,67) | TEST-FE-F22 |
| T-FE-08 | FS-8 Config & Auditoria: `/parametros`,`/configuracoes`, auditoria read-only (FR-65,66,67) | TEST-FE-F25 |
| T-FE-09 | FS-9 Integracao final + E2E + validacao visual + **no-mock validator** + sem regressao no backend (FR-70,72) | TEST-FE-NOMOCK |

Cada fatia: backend necessario + endpoint + banco + frontend + teste + evidencia. Dependencias: FS-1
antes de tudo; FS-2..8 dependem de FS-1; FS-9 depende de todas.
