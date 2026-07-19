# 04 — Decision Ledger

Decisions carried from the intent document (pre-settled by Gabriel), decisions taken during this
session, and decisions resolved autonomously under the A–D protocol.

---

## Part A — Settled by Gabriel (do not reopen)

| ID | Decision | Source |
|---|---|---|
| DEC-01 | Supabase over PostgreSQL; schema delivered as versioned SQL migration files pasteable into the Supabase SQL editor | Intent doc |
| DEC-02 | Supabase Auth; single office login, no roles, no MFA for now; RLS leaves room to segment later | Intent doc |
| DEC-03 | Derived numbers are **materialized** in result tables, recomputed and rewritten inside the same transaction as the fact that changed | Intent doc |
| DEC-04 | Materialized values are **read-only to the user** — no screen, field, or endpoint may overwrite a calculated number | Intent doc |
| DEC-05 | Process passwords live in a secrets vault separate from the app DB; the DB stores only a reference | Intent doc |
| DEC-06 | New movement → task is **manual curation**; the 30-day inertia rule fires **automatically and idempotently** | Intent doc |
| DEC-07 | Audit trail from day one, insert-only | Intent doc |
| DEC-08 | Closing a process deletes it and its linked run history, respecting referential integrity | Intent doc |
| DEC-09 | Technical error email at end of each run to a **configurable** address (default `gacamargo2003@gmail.com`), never containing passwords | Intent doc |
| DEC-10 | ClickUp is replaced by the internal tasks tab | Intent doc |
| DEC-11 | Single run dispatches to multiple scrapers behind a common interface; global concurrency lock (one run at a time, not per tribunal) | Intent doc |
| DEC-12 | The TJSP scraper core is not rewritten; changes happen via adapters and new layers | Intent doc |
| DEC-13 | Only the 3 most recent movements are captured; comparison by deterministic key | Intent doc |
| DEC-14 | Frontend is **out of build scope**; it is consumed as the API contract | Intent doc |

## Part B — Decided this session

| ID | Decision | Rationale |
|---|---|---|
| **DEC-15** | **Every non-TJSP tribunal gets its own purpose-built scraper, written by Gabriel. The plan reserves the slots.** | Direct instruction, 2026-07-19. DataJud is **not** used as the acquisition path. The architecture ships a formal scraper interface + registry with `TJCE` and `TJBA` registered-but-unimplemented, so processes for those tribunals record `pendente_implementacao` without breaking the run, and Gabriel drops implementations into named slots without touching orchestration. See `15-integration-plan.md`. |
| **DEC-16** | `consulta_tjsp_lote.py` is vendored into the product repo under version control as **task #1** | It is currently an untracked file living only in two Downloads folders. It is the highest-value asset in the project and is one `rm` from being lost. |
| **DEC-17** | The multi-layout extractor (`eproc_eventos`, `container_movimentacao`, generic fallback) is **frozen** | Empirically load-bearing: 51 vs 43 real hits across 106 processes. Collapsing it breaks ~40% of queries. Any refactor touching it must fail review. |
| **DEC-18** | `analisar_html()` is the designated test seam; the scraper test battery is **fixture-driven against static HTML**, no browser, no network | The pure-Python mirror already exists and has identical semantics to the browser JS. This turns the document's required test list into deterministic unit tests. |

## Part C — Resolved autonomously (Categories C/D — challenge if wrong)

| ID | Decision | Rationale | Reversibility |
|---|---|---|---|
| **DEC-19** | **A `timeout` does not advance the inertia clock.** The 30-day rule counts only from *confirmed successful* queries; `data_ultimo_andamento` is never modified by a non-success, and the process is flagged `ultima_consulta_inconclusiva`. | 6 of 106 (5.7%) timed out. A timeout means "we don't know if it moved." Leaving the date frozen while treating it as fact would generate false "ligar no Balcão Virtual" tasks for processes that are moving normally — the radar would manufacture work. The opposite (treating it as movement) would hide real stalls. | Reversible — rule lives in one function |
| **DEC-20** | **Password submission is new, additive code in a separate function**, never an edit to the validated navigation path. | The scraper *detects* `senha_necessaria` (5 hits) but has no submission path; the document assumes this is solved. The detector already locates the field, so the seam exists. Confining it to a new function protects DEC-12/DEC-17. | Reversible |
| **DEC-21** | **`FRONTEND_REFERENCE_PAVAGEAU.md` is the authoritative frontend contract**, with `pavageau_v2.jsx` as secondary evidence. Where they conflict, the `.md` wins. | The cited `Pavageau v3.jsx` does not exist. The `.md` self-declares as *"especificação visual e comportamental autoritativa"* and carries concrete tokens, density and radius rules. | Reversible if v3 surfaces |
| **DEC-22** | **Schema is designed from the intent document's prose; the spreadsheet loader is the final phase**, with column-by-column mapping marked `PENDING_VERIFICATION` against real headers. | Neither official workbook nor the MODELO files are reachable. The prose is detailed enough to design the schema confidently, but the "covers every column without exception" guarantee is **not certifiable** and is recorded as such rather than asserted. | Loader phase is isolated |
| **DEC-23** | **The radar worker is host-agnostic**: a standalone Python process reading/writing Supabase over the API. Default deployment is the office Mac via `launchd` (the exact environment where 106 processes ran with 0 captcha timeouts); moving to a VPS with Chrome+Xvfb is deployment config, not architecture. | Where the browser runs is a deployment concern, not a design one, provided the worker holds no Supabase-local state. Starting on the validated environment removes the one unproven variable (datacenter IP → possible captcha increase). A **missing-run alert** compensates for the Mac being off. | Fully reversible |
| **DEC-24** | **Supabase region defaults to `sa-east-1` (São Paulo) and is a BLOCKING gate before project creation.** | Gabriel flagged this himself as the one open non-technical point. LGPD does not forbid international transfer, but hosting in Brazil removes the need for a documented transfer basis and simplifies any client/OAB answer about where process data lives. Recorded as blocking because the region cannot be changed cheaply after creation. | **Blocking — confirm before creating the project** |
| **DEC-25** | **`DATAJUD_API_KEY` — if DataJud is ever used — is env-var-only with no in-code default**, plus fail-fast startup validation. | `consulta_datajud.py:21` ships a key literal as a `os.getenv` fallback. CNJ's key is a shared public one, so severity is low, but the pattern must not reach the product. Not reproduced anywhere in this package. | N/A |
| **DEC-26** | The scraper's real status vocabulary is **adopted as the source of truth** for the `consulta_status` enum, extending the document's list with `numero_invalido`, `pagina_intermediaria`, and `pendente_implementacao`. | The document specifies 8 statuses; the working scraper emits 8 partly-different ones, and real runs produced `numero_invalido` (1) and `pagina_intermediaria`. Planning against the document's list alone would force a lossy translation at the persistence boundary. | Reversible |

## Part D — Resolved during the audit-repair loop (v1.1)

The independent judge found these unresolved. Deferring them would have forced Codex to invent
product decisions, which the doctrine forbids.

| ID | Decision | Rationale |
|---|---|---|
| **DEC-27** | **Vault = Supabase Vault (`vault.secrets`) with the DB storing only `senha_ref`**, and the decryption key held **outside** the database in `SUPABASE_VAULT_KEY_ID`. Env vars: `VAULT_PROVIDER`, `SUPABASE_VAULT_KEY_ID`. `senha_ref` format: `vault:<uuid>`. | DEC-05 requires the vault be *separate from the app DB*. Strictly read, Supabase Vault lives in the same Postgres — but its encryption key is managed by Supabase KMS and is **not** in the database, so a dump of the app database yields ciphertext only, which is the actual property DEC-05 protects. The alternative (AWS Secrets Manager) adds a second cloud vendor, IAM, and network failure modes for **5 passwords**. `vault.py` is an interface with one implementation, so switching later is one class. |
| **DEC-28** | **API stack = FastAPI; request handlers connect with the caller's JWT, never `service_role`.** | `service_role` bypasses RLS. Using it for request handling would silently void NFR-01 and threat control T3 — the `REVOKE` on `ind_*` would be revoked on a role nobody uses, so the plan would *look* protected and not be. Python also lets the API and the radar worker share one domain layer. |
| **DEC-29** | **Migration order is radar-before-tasks**: `005_radar.sql`, `006_tarefas.sql`. | `tarefas` has FKs to `movimentacoes_novas` and `processos`. The original order made `005` reference tables created in `006` — the schema would fail on the first clean rebuild, i.e. `GATE-SCHEMA` fails immediately. |
| **DEC-30** | **`000_bootstrap.sql` creates `pgcrypto`, and — on local Postgres only — a stub `auth` schema, an `auth.users` table and an `authenticated` role.** | `auth.users` and the `authenticated` role do not exist on stock Postgres, so migrations 005/006/009 could not run in the local-development path the handoff mandates while OPEN-01 is open. The stub is guarded by `IF NOT EXISTS` so it is inert on Supabase. |
| **DEC-31** | **`tribunal` is an enum (`tribunal_sigla`), not free text; `processos.numero` carries a CNJ-format CHECK.** | Free text contradicts the plan's own vocabulary doctrine, and a typo would route to `pendente_implementacao` **forever, silently** — that status is by design not a failure, so nothing would ever surface it. The real run also produced one `numero_invalido`, which would otherwise consume a browser slot weekly, indefinitely. |
| **DEC-32** | **All derived report formulas are evaluated *as of* a reference month, never against `current_date`.** | `inadimplencia`/`a_receber` were defined relative to "current month" but stored in `(ano,mes)` rows recalculated only on fact change. Every materialized row would silently go stale at each month boundary, and TEST-CALC-07 — the keystone invariant — would fail on the first of every month with no fact having changed. |
| **DEC-33** | **Overdue receivables remain in `balanco.ativo`.** | Excluding them while counting *all* unpaid exits in `passivo` systematically understates equity for a firm carrying real inadimplência. `patrimonio_liquido` closes by construction either way, so TEST-CALC-04 would have passed while the balance sheet was wrong — the asymmetry is invisible to the test that ought to catch it. |
| **DEC-34** | **Write allowlists on every endpoint; radar-owned columns are not API-writable.** | The RLS baseline is `USING (true)`, so without allowlists an authenticated user could overwrite `chaves_movimentacoes` and `data_ultimo_andamento` through `PATCH /processos/:id` — corrupting exactly the baseline that DEC-19 and TEST-RADAR-19 exist to protect, but through the front door instead of via concurrent runs. |

## Part E — Zero-question closure pass (v2.0.0)

Every remaining deferral was resolved. Nothing is left for Codex to ask.

| ID | Decision | Supersedes | Rationale |
|---|---|---|---|
| **DEC-35** | **Region resolved: `AWS_REGION` is validated configuration, default `sa-east-1`**, allowlist-checked, fail-fast on startup. Local/CI never read it. | **Closes OPEN-01** and supersedes DEC-24's "blocking gate" | LGPD: Brazilian clients of a Brazilian firm; hosting in-country removes any international-transfer basis. Expressing it as validated config rather than a constant means changing region is an env override, not a code change — and *nothing* in Phases 0–6 waits on it. |
| **DEC-36** | **Three runtime identities, fully specified**: caller JWT (API, RLS applies) · `radar_worker` Postgres role (worker, RLS applies, explicit policies) · `service_role` (**migrations only**). | Completes DEC-28 | `service_role` bypasses RLS and can never be least-privilege. If the API or worker used it, the `REVOKE` on `ind_*` would sit on a role nobody connects as — NFR-01 would read as satisfied while being unenforceable. |
| **DEC-37** | **Spreadsheets are NOT required for correctness.** They affect only the Phase 6 historical load. Full import contract, column aliases, validation severities, synthetic fixtures and replacement procedure are specified now. | **Closes OPEN-02** and supersedes DEC-22 | The workbooks contain typed-over formulas, 15 spellings for 8 fee types and 4 orphaned clients — a file with known-wrong arithmetic cannot be a correctness oracle. Synthetic fixtures with hand-computed expected values are a *better* oracle, and they exist today. |
| **DEC-38** | **TJCE and TJBA are out of scope for v1**; `pendente_implementacao` behavior is a v1 deliverable across DB, backend, API, frontend contract, metrics, tests and docs. | Formalizes DEC-15 | ~90% of the portfolio is TJSP. Holding v1 for 12 processes would delay the financial system — the larger share of value. Safe only because the 12 stay visible and counted every run (FR-45). |
| **DEC-39** | **The canonical scraper is vendored into the package** at `vendor/scraper/consulta_tjsp_lote.py`, sha256 `c9429f2a…`, with golden fixtures for both protected layout branches. | Supersedes DEC-16 ("commit it as task #1") | Codex must not search Downloads or adjudicate between external copies. Three copies existed with two hashes; the superseded one produced the *failing* 07-16 log. Provenance is recorded in `vendor/PROVENANCE.md`. |

| **DEC-40** | **The frontend contract is vendored** at `vendor/frontend/FRONTEND_REFERENCE_PAVAGEAU.md` (+ `pavageau_v2.jsx`). | T-036 must reconcile read-endpoint field names against it before freezing. Leaving it in `~/Downloads` made a mandatory step depend on an external file while the handoff forbade searching Downloads — a contradiction Codex could only resolve by asking. |
| **DEC-41** | **The 118 known processes are vendored** as `vendor/seed/processos_seed.csv` (106 TJSP · 7 TJCE · 5 TJBA), the one malformed CNJ flagged `valido=false`. | `GATE-PROD-RUN`/EVID-01 asserts `taxa_conclusiva` against the 0.887 baseline and the 51/43 layout split — meaningless without the real processes registered. The numbers were recovered from the already-vendored validated run and the tribunal workbook, so no external file is needed. |

---

## Open / blocking

**None.** OPEN-01 and OPEN-02 are closed by DEC-35 and DEC-37.

The single remaining dependency is external and operational, not a decision:

| ID | Dependency | Owner | Blocks | Codex impact |
|---|---|---|---|---|
| **EXT-DEP-01** | Create the Supabase project in `sa-east-1`; supply `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RADAR_DB_URL` | Gabriel (account owner) | Production provisioning; `GATE-PROD-RUN` | **None.** Every phase builds and verifies on local Postgres. Codex must not wait, ask, or stop. |
