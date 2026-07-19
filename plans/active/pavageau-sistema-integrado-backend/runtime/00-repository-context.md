# 00 — Repository & Asset Context (Preflight)

**Plan slug:** `pavageau-sistema-integrado-backend`
**Date:** 2026-07-19
**Classification:** `create` (greenfield backend/database) + `integrate` (wrap an existing, validated scraper core).

> **Status: all findings below are CLOSED.** This document is the preflight *record* — it preserves
> how the package's decisions were reached, including one retracted finding. Every `→ RESOLVED`
> marker points at the deciding entry in `04-decision-ledger.md`. **Nothing here is an open question,
> and no asset referenced here lives outside this package.**

> **Correction notice.** An earlier revision of this preflight concluded the TJSP scraper did not
> exist, based on prototype files in `~/Desktop/testeprocessos/`. That conclusion was **wrong**.
> The real scraper is `consulta_tjsp_lote.py`, and it does everything the intent document claims.
> The retraction is recorded in full as FINDING-01 rather than quietly deleted.

> **Secret policy note:** an API key literal was observed in `consulta_datajud.py` during preflight.
> It has not been printed, copied, or committed anywhere in this plan package. It is referenced
> only by env-var name. See FINDING-06.

---

## 1. Target repository

The primary working directory is the **Autonomous System Building OS** — a planning factory, not
the product repo. `plans/active/` was empty before this run.

**Resolved during the closure pass (DEC-39).** The canonical scraper is **no longer external**: it is
vendored into this package at `vendor/scraper/consulta_tjsp_lote.py`
(sha256 `c9429f2a…`), together with golden fixtures, the validated run output, the frontend contract
(`vendor/frontend/`) and the 118-row process seed (`vendor/seed/`). Provenance and the
canonical-copy adjudication are in `vendor/PROVENANCE.md`.

Codex's first task is **T-004 — characterization tests against the already-versioned scraper**, not
"commit the scraper". Nothing in `~/Downloads` is required to start or finish implementation.

## 2. Assets located

| Asset | Path | Size | State |
|---|---|---|---|
| **TJSP batch scraper** | **`vendor/scraper/consulta_tjsp_lote.py` (vendored, in-package)** | **1,622 lines** | **Canonical, frozen, sha256 `c9429f2a…`** |
| Validated run output | **`vendor/fixtures/resultado_processos_tjsp.json` (vendored)** | 106 processes | Empirical evidence, see FINDING-02 |
| Run log | `~/Downloads/teste_deteccao_bot/logs/consulta_processos_tjsp.log` | — | Earlier, less mature version |
| Process input sheet | `~/Downloads/processos.xlsx` | 7.3 KB | Sheet `Página1`, column `PROCESSO`, 106 rows |
| DataJud API client | `~/Desktop/testeprocessos/consulta_datajud.py` | 324 lines | **Not used** — DataJud rejected as an acquisition path (DEC-15) |
| Early browser spikes | `~/Desktop/testeprocessos/teste_scrapper{,2}.py` | 190 / 132 lines | Superseded — do not carry forward |
| Frontend reference spec | **`vendor/frontend/FRONTEND_REFERENCE_PAVAGEAU.md` (vendored)** | 2080 lines | Authoritative contract anchor (DEC-21, DEC-40) |
| Frontend draft | **`vendor/frontend/pavageau_v2.jsx` (vendored)** | 1650 lines | Secondary evidence |
| Slides | `~/Downloads/Pavageau_Sistema_Integrado.pptx` | — | Present |
| Tribunal volumes | `~/Downloads/Pavageau_Top3_Tribunais.xlsx` | 2 sheets | TJSP 106 / TJCE 7 / TJBA 5 |

## 3. Cited but NOT FOUND

- `Pavageau v3.jsx` — only `pavageau_v2.jsx` exists.
- Official cash-flow workbook (`DASHBOARD`, `CONFIG`, `JAN`–`DEZ`).
- Official contracts workbook (`DASHBOARD`, `CONTRATOS`, `ENCERRADOS`, `PENDENTES`, `MENSAIS`).
- The `MODELO` workbooks cited as the validation mirror for the data load.

Searched: repo tree, `~/Desktop` (depth 5), `~` (depth 6), `~/Downloads`, `~/Documents`.
Note `~/Downloads/processos.xlsx` is the *radar* input (process numbers only) — it is **not** either
of the two financial workbooks.

---

## 4. Findings

### FINDING-01 — RETRACTED — "The scraper does not exist"

**This finding was wrong and is retracted.** It was raised after reading only
`~/Desktop/testeprocessos/teste_scrapper{,2}.py` — two early spikes that indeed extract nothing and
block on human input. Those files are **superseded prototypes**, not the system.

`consulta_tjsp_lote.py` (1,622 lines) implements every capability the intent document claims:

| Document claim | Implementation | Verified |
|---|---|---|
| "recebe os processos por um Excel" | `carregar_processos()` — openpyxl, CNJ formatting, dedupe, 20-digit validation | ✅ |
| "devolve um JSON" | `salvar_checkpoint()` — atomic `.tmp` + `replace()` | ✅ |
| "extrair as movimentações" | `JS_ANALISAR_PAGINA` + `analisar_html()` | ✅ |
| "principais padrões de páginas do TJSP" | 3 layouts: `eproc_eventos`, `container_movimentacao`, generic-table fallback | ✅ |
| "três movimentações mais recentes" | `MAX_MOVIMENTACOES = 3` | ✅ |
| "se recuperar de falhas" | Per-process retry, transient-status set, watchdogs, HTML/JSON/PNG diagnostics | ✅ |
| "aba própria… fechar antes de avançar" | `abrir_aba` / `fechar_aba` in `finally` | ✅ |
| "persiste incrementalmente" | Checkpoint written after **every** process | ✅ |
| "falha de um processo não interrompe os demais" | Per-process exception isolation | ✅ |
| Status enum | `STATUS_RESUMO` — 8 values, near-exact match to the document | ✅ |
| Multi-portal seam | `PortalConfig` frozen dataclass, explicitly documented for reuse | ✅ |

**Two capabilities exceed the document's description and materially help this plan:**

1. **`analisar_html()`** (lines 500–694) is a pure-Python BeautifulSoup mirror of the browser JS with
   identical semantics. Extraction is therefore **testable offline against static HTML fixtures**,
   with no browser and no network. The document's required test battery (base inicial, nenhuma
   movimentação nova, uma nova, três diferentes, não localizado, senha, captcha) becomes fixture-driven
   and deterministic. This is the single most valuable testability asset in the codebase.
2. **Resume/checkpoint** (`RETOMAR_EXECUCAO_ANTERIOR`, `STATUS_DEFINITIVOS`) already satisfies the
   document's "interrupção não perde o que já foi feito" requirement.

**Directive stands, and is now well-founded:** treat this file as the scraper core. Wrap it with
adapters; do not rewrite its navigation, layout detection, extraction, or recovery logic.

### FINDING-02 — The scraper is validated at production scale (empirical)

From `resultado_processos_tjsp.json`, run of **2026-07-19 01:49→01:53** (4m29s):

| Metric | Value |
|---|---|
| Processes | 106 |
| **Sucesso** | **94 (88.7%)** |
| Movimentações extracted | **282** |
| `senha_necessaria` | 5 |
| `timeout` | 6 |
| `numero_invalido` | 1 |
| **`captcha_timeout`** | **0** |
| **`erro`** | **0** |
| Mean / max per process | 6.2s / 16.0s |

Layouts actually exercised: `eproc_eventos` **51**, `container_movimentacao` **43**, none 12.
Both primary layouts fire at comparable volume — the multi-layout abstraction is **load-bearing in
production, not speculative**. Any refactor that collapses it would break ~40% of queries.

Base session readiness: `Formulário pronto em 0.12s` — no Cloudflare wall, no manual step.

**Captcha nuance, stated precisely:** the older `2026-07-16` log shows 51 real captcha detections,
i.e. TJSP *does* challenge intermittently. The current version handles this (it waits the challenge
out rather than failing) and the 07-19 run recorded **zero** captcha timeouts across 106 queries.
The folder name `teste_deteccao_bot` indicates this was an explicit bot-detection test; it passed.
Conclusion: captcha is a **handled, intermittent condition**, not a blocker — but it is the variable
most likely to change without notice, so the plan instruments it rather than assuming it away.

### FINDING-03 — MAJOR — Timeout semantics are undefined, and the inertia rule depends on them

6 of 106 processes (5.7%) returned `timeout` after exhausting `MAX_TENTATIVAS_POR_PROCESSO = 2`.

A timeout means **"we do not know whether this process moved."** The intent document does not say
what the radar should do with that, and two of its own rules collide over it:

- The **30-day inertia rule** keys off `data_ultimo_andamento`. If a timeout silently leaves that
  date untouched, a process that times out repeatedly will eventually trip the inertia rule and
  generate a "ligar no Balcão Virtual" task for a process that may be moving normally — a **false
  positive** born of a scraping gap, not a real stall.
- Conversely, if a timeout is treated as "no movement", a real movement can go **undetected** until
  the next weekly run.

Neither is acceptable silently. → **RESOLVED: DEC-19** (timeout does not advance the inertia clock).

### FINDING-04 — MAJOR — Password submission does not exist; only detection does

5 processes returned `senha_necessaria`. The scraper **detects** the condition well (`PortalConfig.
mensagens_senha_necessaria`, plus DOM probing for `input[type=password]` / `senha` / `chave de acesso`),
and returns it as a terminal status.

But there is **no code path that submits a password.** The document's flow — "usuário cadastra a
senha → o processo passa a ser consultável nas próximas rodadas" — therefore requires **new code
inside the scraper core**, which is the one file the document says not to modify.

This is additive and the seam already exists (the detector locates the field), but it is real work
that the document accounts for as already-solved. It must be planned explicitly, with the change
confined to a new function rather than edits to the validated navigation path. → **RESOLVED: DEC-20** (password submission is additive code in the adapter).

### FINDING-05 — MAJOR — TJCE and TJBA have no scraper and are invisible today

| Position | Tribunal | Processes |
|---|---|---|
| 1 | TJSP | 106 |
| 2 | TJCE | 7 |
| 3 | TJBA | 5 |

`PORTAL_TJSP` is TJSP-specific (eproc URL, `#txtNumProcesso`, `#sbmNovo`). TJCE and TJBA run
different systems with different forms and different layouts. **12 real processes today** are
outside radar coverage. The document treats multi-tribunal as future-facing ("quando existir"); it
is a present gap.

Two ways to close it: author two more `PortalConfig` profiles plus layout handling (real work,
new anti-bot surfaces, ongoing maintenance for 11% of volume), or route non-TJSP through
**DataJud**, which serves both by changing one URL segment (`api_publica_tjce`, `api_publica_tjba`).
→ **RESOLVED: DEC-15 + DEC-38** (a scraper per tribunal, written by Gabriel; TJCE/TJBA out of v1 scope).

### FINDING-06 — MAJOR (security) — Hardcoded API key default

`consulta_datajud.py` line 21 passes a key literal as the fallback default to
`os.getenv("DATAJUD_API_KEY", <literal>)`.

Severity is mitigated — CNJ publishes a *shared public* key for DataJud, so this is not a private
credential — but the pattern must not survive into the product. The plan mandates `DATAJUD_API_KEY`
as **env-var-only with no in-code default**, plus fail-fast startup validation. The literal is not
reproduced in this package.

### FINDING-07 — MAJOR — Deployment surface: the scraper needs a real browser host

`criar_navegador()` builds a `ChromiumPage` via DrissionPage with `--start-maximized`, driving a
real Chrome. This **cannot run on Supabase** (no compute for browsers) and is not a serverless
workload. The weekly run needs a persistent host with Chrome and a display (or Xvfb).

The intent document specifies the scheduler and the run but never says **where the browser lives**.
Left unresolved, Codex will invent an answer. → **RESOLVED: DEC-23 + DEC-35** (host-agnostic worker; region is validated config).

### FINDING-08 — MAJOR — Frontend contract anchor is misnamed

Cited `Pavageau v3.jsx` does not exist. What exists: `pavageau_v2.jsx` (1650 lines) and
`FRONTEND_REFERENCE_PAVAGEAU.md` (2080 lines), the latter self-declaring as *"especificação visual e
comportamental autoritativa"* with concrete tokens (`--navy: #1E2A56`), density rules (13–17px card
padding, 35–40px rows) and 2px radii. Since the API surface derives from the frontend contract, the
anchor must be confirmed before endpoint shapes freeze. → **RESOLVED: DEC-21 + DEC-40** (`FRONTEND_REFERENCE_PAVAGEAU.md` is authoritative and is vendored at `vendor/frontend/`).

### FINDING-09 — MAJOR — Source spreadsheets absent; "every column" cannot be certified

The document guarantees the schema covers *"sem exceção, cada coluna que hoje é preenchida"* and
that `MODELO` workbooks validate the load. None are reachable. The prose is detailed enough to
design the schema confidently, but (1) exhaustive coverage is unverifiable, (2) the load script
cannot be finalized against real headers, (3) derived-calculation tests have no fixtures. → **RESOLVED: DEC-37** (workbooks not required for correctness; synthetic fixtures).

---

## 5. Layer applicability

| Layer | Applicable | Note |
|---|---|---|
| Database | **Yes** | Supabase/PostgreSQL — core |
| Backend/API | **Yes** | Core |
| Auth | **Yes** | Supabase Auth, single office account, RLS |
| Frontend | **Contract only** | Build excluded by the user; consumed as API anchor |
| AI | **No** | Deterministic product — see note |
| Integrations | **Yes** | TJSP scraper (+ reserved TJCE/TJBA slots), SMTP, secrets vault. **DataJud is excluded by DEC-15** — Gabriel writes a scraper per tribunal. |
| Infra | **Yes** | Supabase project + browser worker host + scheduler |
| Security | **Yes** | Process passwords, RLS, audit trail |
| Observability | **Yes** | Radar run telemetry, error email |
| Performance | **Yes** | Materialized read tables |
| Testing | **Yes** | Transactional, RLS, and fixture-driven scraper tests |

**AI note:** `product-logic-and-intelligence-grill` was run. Every decision in this product is owned
by `deterministic_backend` or `human`; the AI responsibility matrix is empty **by design**, not by
omission. Per `production-ready.md`, `real-ai-integration-planning` is **not applicable** and is
correctly skipped — no AI layer is being silently dropped. Movement→task curation is explicitly
human, and the 30-day inertia rule is explicitly deterministic.
