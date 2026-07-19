# 44 — Requirements & Vertical Traceability

Every requirement travels: rule → data → backend → API → test → gate.
Frontend column reads **contract** because the frontend is consumed, not built (DEC-14).

---

## Functional requirements

| ID | Requirement | Data | Backend/API | Test | Gate |
|---|---|---|---|---|---|
| FR-01 | Register partners as references, never free text | `parceiros` + FK RESTRICT | `/parceiros` | **TEST-TX-15** | GATE-SCHEMA |
| FR-02 | Unify CONTRATOS/ENCERRADOS/PENDENTES into one table with a status | `contratos.status` enum | `/contratos` | **TEST-TX-16** | GATE-SCHEMA |
| FR-03 | Close the honorarium vocabulary (15 spellings → 8 types) | `tipo_honorario` enum | `/contratos` | **TEST-SCHEMA-01** (enum rejects an unknown spelling) · TEST-LOAD-02 *(Phase 6)* | GATE-SCHEMA |
| FR-04 | Instalments always reference a contract | `parcelas.contrato_id` NOT NULL | `/contratos/:id/parcelas` | **TEST-SCHEMA-02** (insert with null/unknown contract rejected) · TEST-LOAD-03 *(Phase 6)* | GATE-SCHEMA |
| FR-05 | Contract deletion decides the fate of instalments explicitly | `ON DELETE RESTRICT` | 409 + `?cascade=` | TEST-TX-09 | GATE-TX |
| FR-06 | Entries are the only place money is typed | `lancamentos` | `/lancamentos` | TEST-CALC-01 | GATE-CALC |
| FR-07 | Entries carry provenance (origin + origin id) | `origem`, `origem_id` | all write paths | TEST-TX-01..03 | GATE-TX |
| FR-08 | Fixed costs have an end of validity | `custos_fixos.mes_fim` | `/custos-fixos` | **TEST-TX-11**, **TEST-CALC-15** | GATE-CALC |
| **FR-52** | **README, run report and evidence index are delivered** — satisfies `documentation_complete` and `deviation_report_complete` | `docs/**` | `documentation-writer` | **TEST-DOC-01** | GATE-DOCS |
| **FR-51** | **Fixed costs offer a per-month post-to-cash action** | `ux_lanc_origem` composite key | **`POST /custos-fixos/:id/lancar`** | TEST-TX-10, -12, -13 | GATE-TX |
| FR-09 | A fixed cost cannot post twice in the same month | `ux_lanc_origem` | 409 | TEST-TX-06 | GATE-TX |
| FR-10 | Only 4 configuration numbers exist | `parametros` | `/parametros/:ano` | TEST-CALC-02 | GATE-CALC |
| FR-11 | **Confirming an instalment creates its entry, atomically** | tx | `POST /parcelas/:id/confirmar` | TEST-TX-01, -04 | GATE-TX |
| FR-12 | **Reversal undoes both sides, atomically** | tx | `POST /parcelas/:id/estornar` | TEST-TX-02, -04 | GATE-TX |
| FR-13 | **An entry may settle an instalment in one transaction** | tx | `POST /lancamentos` + `parcela_id` | TEST-TX-03 | GATE-TX |
| FR-14 | **A new movement becomes a task, once** | `ux_tarefa_movimentacao` | `POST /movimentacoes/:id/criar-tarefa` | TEST-TX-07 | GATE-TX |
| FR-15 | New movements enter by **manual curation** | `movimentacoes_novas.virou_tarefa` | `GET /radar/movimentacoes-novas` | TEST-RADAR-03 | GATE-RADAR |
| FR-16 | **30-day inertia fires automatically and idempotently** | `ux_tarefa_inercia_aberta` | `inercia.py` | TEST-TX-08, TEST-RADAR-11 | GATE-RADAR |
| FR-17 | One run dispatches by tribunal behind a common interface | `processos.tribunal` | `registry.resolver()` | TEST-RADAR-16 | GATE-RADAR |
| FR-18 | **Unimplemented tribunals record `pendente_implementacao` without breaking the run** | `consulta_status` | orchestrator | TEST-RADAR-16 | GATE-RADAR |
| FR-19 | Only the 3 most recent movements; compare by deterministic key | `chaves_movimentacoes` | `comparacao.py` | TEST-RADAR-18 | GATE-RADAR |
| FR-20 | First query creates the baseline without flagging novelty | — | `comparacao.py` | TEST-RADAR-01 | GATE-RADAR |
| FR-21 | Password-gated processes are recorded and become queryable after registration | `exige_senha`, `senha_ref` | `PUT /processos/:id/senha` | TEST-RADAR-06, -13 | GATE-SECRETS |
| FR-22 | Two runs can never overlap | advisory lock | 409 | TEST-RADAR-10 | GATE-RADAR |
| FR-23 | Incremental persistence survives interruption | per-process tx | orchestrator | TEST-RADAR-09 | GATE-RADAR |
| FR-24 | One process failing never stops the run | per-process isolation | orchestrator | TEST-RADAR-08 | GATE-RADAR |
| FR-25 | Technical error email at end of run, configurable, redacted | — | `notificacao.py` | TEST-SEC-03 | GATE-SECRETS |
| FR-26 | Closing a process deletes it and its history | `ON DELETE CASCADE` | `DELETE /processos/:id` | TEST-RADAR-12 | GATE-SCHEMA |
| FR-27 | Derived reports served from materialized tables | `ind_*` | read endpoints | TEST-CALC-07 | GATE-CALC |
| FR-28 | Audit trail records who changed what, insert-only | `auditoria` | all writes | TEST-SEC-02 | GATE-SECRETS |
| FR-29 | Newly registered processes are not queried immediately | `ativo` | `POST /processos` | **TEST-RADAR-29** (create → assert no immediate query; picked up next run) | GATE-RADAR |
| **FR-30** | **Weekly run at a configurable time** | `configuracoes.radar_cron` | `GET/PUT /configuracoes` | **TEST-CFG-01** | GATE-RADAR |
| **FR-31** | **Error email recipient is configurable** | `configuracoes.radar_email_erros` | `PUT /configuracoes/:chave` | **TEST-CFG-02** | GATE-SECRETS |
| **FR-32** | **Error email carries number, status, message, step, timestamp** | `resultados_consulta.etapa` | `notificacao.py` | TEST-RADAR-22 | GATE-SECRETS |
| **FR-33** | **A failed email never fails the run** | — | `notificacao.py` | TEST-RADAR-20 | GATE-RADAR |
| **FR-34** | **Alert when no run completes within N days** | `configuracoes` + `pg_cron` | off-host scheduled function | TEST-RADAR-23 | GATE-RADAR |
| **FR-35** | **Monthly analyses: faturamento, gastos/categoria, clientes fechados, restituições, inadimplência** | `ind_analise_mensal`, `ind_gastos_categoria` | `GET /analises/mes` | TEST-CALC-05, -13 | GATE-CALC |
| **FR-36** | **Conversion rate, year-scoped** | `ind_painel.taxa_conversao` | `GET /painel` | TEST-CALC-12 | GATE-CALC |
| **FR-37** | **Derived indicators with no fields: reserve months, % recurring revenue, monthly fixed cost, % goal** | `ind_painel` (computed) | `GET /painel` | TEST-CALC-13 | GATE-CALC |
| **FR-38** | **Projected success/sucumbência split, open contracts only** | `ind_painel` | `GET /painel` | TEST-CALC-06, -14 | GATE-CALC |
| **FR-39** | **A password-gated process becomes queryable after registration** | vault + `senha_ref` | `PUT /processos/:id/senha` | **TEST-RADAR-27** | GATE-SECRETS |
| **FR-40** | **Audit rows are actually written for every sensitive operation** | `auditoria` | all mutating paths | TEST-AUD-01..06 | GATE-SECRETS |
| **FR-41** | **Alert when the captcha-timeout rate exceeds 20% in a run** | `total_captcha_timeout` | `notificacao.py` | TEST-RADAR-30 | GATE-RADAR |
| **FR-42** | **Alert when `taxa_conclusiva` falls below 0.70** | run counters | `notificacao.py` | TEST-RADAR-30 | GATE-RADAR |
| **FR-43** | **`radar_worker` can do its job and nothing more** | `010_radar_role.sql` | — | TEST-SEC-07 | GATE-SECRETS |
| **FR-44** | **Idempotent, auditable spreadsheet loader with vocabulary normalization and orphan reconciliation** | `import_log` | `app.loader` CLI | TEST-LOAD-01…05 (synthetic fixtures) | GATE-LOAD |
| **FR-45** | **A run with 12 pending processes finishes `concluida`** | `total_pendente_implementacao` | orchestrator | TEST-RADAR-31 | GATE-RADAR |
| **FR-46** | **Deployment region is validated configuration** (`AWS_REGION`, default `sa-east-1`) | — | `app/config.py` | TEST-CFG-03 | GATE-SCHEMA |
| **FR-47** | **Local/CI implementation runs with no region or Supabase configuration** | `000_bootstrap.sql` | docker compose | TEST-CFG-04 | GATE-SCHEMA |
| **FR-49** | **The 118 known processes are seeded from a vendored list** (106 TJSP · 7 TJCE · 5 TJBA); the 1 malformed CNJ is reported and skipped | `processos` | `vendor/seed/processos_seed.csv` | TEST-RADAR-32 | GATE-RADAR |
| **FR-50** | **`import_log` records every loader decision and is insert-only** | `import_log` | `app.loader` | TEST-LOAD-07 | GATE-LOAD |
| **FR-48** | **The canonical scraper is byte-frozen and both layout branches are golden-tested** | `vendor/` | CI | TEST-SCRAPER-01/02/03 | GATE-SCRAPER-FROZEN |

## Non-functional requirements

| ID | Requirement | Mechanism | Test | Gate |
|---|---|---|---|---|
| NFR-01 | **No calculated value is user-writable** | No grant, no endpoint, **caller-JWT connection** (DEC-28) | TEST-SEC-01, **TEST-SEC-05** | GATE-SECRETS |
| **NFR-13** | **Radar-owned state is not API-writable** | Write allowlists (DEC-34) | **TEST-SEC-06** | GATE-SECRETS |
| **NFR-14** | **Historical report values survive a month boundary unchanged**; only `ind_painel` rolls with the calendar (07 §6.1) | As-of-month formulas (DEC-32) | TEST-CALC-10, TEST-CALC-19 | GATE-CALC |
| NFR-02 | **Materialized value never diverges from a from-scratch recomputation** | Same-transaction recalc | **TEST-CALC-07** | GATE-CALC |
| NFR-03 | Reports open fast: **p95 < 300 ms** on `GET /painel` and `/fluxo-caixa` | Materialized reads | **TEST-PERF-01** | GATE-CALC |
| NFR-04 | Recalculation is incremental and scoped | `recalcular_mes(ano,mes)` | TEST-CALC-08 | GATE-CALC |
| NFR-05 | Nothing readable/writable unauthenticated | RLS everywhere | TEST-RLS-01 | GATE-RLS |
| NFR-06 | Passwords never in logs, responses, email, audit, or debug artifacts | 5 channels closed | TEST-SEC-03 | GATE-SECRETS |
| NFR-07 | Process passwords in a vault, DB holds a reference | `senha_ref` | TEST-SEC-04 | GATE-SECRETS |
| NFR-08 | **The validated scraper core is not rewritten** | Vendored + frozen | TEST-RADAR-17 + characterization | GATE-SCRAPER-FROZEN |
| NFR-09 | Adding a tribunal touches only a new file + one registry line | Protocol + registry | TEST-RADAR-16 | GATE-RADAR |
| NFR-10 | Scraper never queries the DB | `ProcessoConsulta` in / `ResultadoConsulta` out | **TEST-ARCH-01** — CI import-graph assertion | GATE-SCRAPER-FROZEN |
| NFR-11 | Extraction testable with no browser/network | `analisar_html()` fixtures | **TEST-SCRAPER-02**, **TEST-SCRAPER-03** (run offline, no browser, no network) | GATE-RADAR |
| NFR-12 | A run proven on the actual deployment host | Real end-to-end run | **EVID-01** — evidence-based verification, defined in §Verification methods | GATE-PROD-RUN |

## Layer coverage

| Layer | Covered | Evidence |
|---|---|---|
| Database | ✅ | `07-data-architecture-plan.md` |
| Backend/API | ✅ | `13-api-contract-plan.md` |
| Auth/Security | ✅ | `09-auth-authorization-plan.md` |
| Integrations | ✅ | `15-integration-plan.md` |
| Testing | ✅ | `21-test-validation-plan.md` |
| Infra/Deploy | ✅ | DEC-23, GATE-PROD-RUN |
| Observability | ✅ | `15-integration-plan.md` §8 |
| Performance | ✅ | Materialization + indexes; §7 data plan |
| Frontend | ⬜ **Contract only** | Excluded by the user (DEC-14); anchor = DEC-21 |
| AI | ⬜ **Not applicable** | Deterministic product; matrix empty by design, not omission |

## Mapping integrity

Stated precisely rather than as a blanket claim (the v1.0 assertion "unmapped: none" was **false** —
the independent judge caught four requirements whose only test sat in the deferred Phase 6, and four
whose cited test did not exercise the stated requirement).

| Status | Count |
|---|---|
| Functional requirements (FR-01…FR-29 incl. FR-51, plus FR-30…FR-50) | **51** |
| Non-functional requirements (NFR-01…NFR-14) | **14** |
| **Total** | **66** |
| Verified by an executable test | **65** |
| Verified by a defined evidence procedure | **1** (NFR-12 → EVID-01) |
| **Verified by neither** | **0** |

### Verification methods

**EVID-01 — NFR-12, evidence-based (not a unit test).** A unit test cannot establish that a real
browser run works on the machine it will actually run on. Verification is a **recorded procedure with
retained artifacts**, executed once per deployment host under `GATE-PROD-RUN`:

| Step | Evidence retained |
|---|---|
| 1. Run the full radar on the target host against live TJSP | `execucoes_radar` row id |
| 2. Capture per-status totals | Counter snapshot |
| 3. Assert `taxa_conclusiva` ≥ 0.70 (baseline 0.887) | Pass/fail with the measured value |
| 4. Assert `captcha_timeout` rate ≤ 20% | Pass/fail with the measured value |
| 5. Assert layout distribution ≈ the 51/43 baseline | Distribution comparison |
| 6. Record host, IP class (residential/datacenter), Chrome version, wall time | Environment record |

Committed to `docs/evidence/prod-run-<date>.md`. Re-executed whenever the host changes — a
datacenter IP is an unproven variable for captcha behavior, and this is what would catch it.



Requirements dependent on an external file at implementation start: **none** — Phase 6 builds and
completes against synthetic fixtures (19 §5).

Requirements testable only in the deferred Phase 6: **none.** FR-03 and FR-04 carry
`TEST-SCHEMA-01/02` in buildable scope; the Phase 6 load tests are *additional* coverage, not their
only coverage.

**Requirements added during the audit-repair loop:** FR-51, FR-30 … FR-48, NFR-13, NFR-14. Each
existed as prose in the source document or as a mechanism in the plans, but had no requirement ID,
no test, or no API surface before the audit.
