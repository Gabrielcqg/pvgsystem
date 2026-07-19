# 20 — Tribunal Scope: TJCE and TJBA

## 1. Decision — RESOLVED (DEC-38)

**TJCE and TJBA are OUT OF SCOPE for v1. Their absence does not block production completion.**

| Tribunal | Processes | v1 status |
|---|---|---|
| TJSP | 106 (89.8%) | **In scope** — canonical scraper, validated |
| TJCE | 7 (5.9%) | **Out of scope** — slot reserved |
| TJBA | 5 (4.2%) | **Out of scope** — slot reserved |

**Rationale.** Gabriel writes each non-TJSP scraper himself (DEC-15). v1's purpose is to replace two
broken spreadsheets and automate TJSP monitoring, which covers ~90% of the portfolio. Holding v1
until two additional portals are reverse-engineered would delay the financial system — the larger
share of the product's value — for 12 processes.

**This is a deliberate coverage limit, not an oversight.** The 12 processes are **visible, counted
and reported every run**; they are never silently skipped. That visibility is the condition that
makes deferring them acceptable.

**Codex is prohibited from:** implementing a TJCE or TJBA scraper; substituting an API (DataJud or
otherwise); routing those processes to the TJSP scraper; hiding, deactivating or filtering them out
to make counters look cleaner.

## 2. `pendente_implementacao` — behavior in every layer

The contract that makes the deferral safe. **Every layer below is a v1 deliverable.**

### 2.1 Database
- `consulta_status` enum includes `pendente_implementacao` (07 §1).
- `tribunal_sigla` enum includes `TJCE` and `TJBA` — the processes are **first-class rows**, not invalid data.
- `execucoes_radar.total_pendente_implementacao` is a first-class counter (07 §3.2).
- A `resultados_consulta` row is written for each such process on every run — the audit trail shows they were considered and why they were not queried.

### 2.2 Backend / orchestration
```python
scraper = resolver(processo.tribunal)
if scraper is None:
    persistir_resultado(status="pendente_implementacao",
                        mensagem_erro=f"Nenhum scraper implementado para {processo.tribunal}")
    atualizar_totais(); continue        # run continues
```
- **Excluded from `taxa_conclusiva`'s denominator** (15 §6). Otherwise 12 known-deferred processes
  would peg the rate at 88.7% before a single query ran, making the 0.70 threshold meaningless.
- Baseline, `data_ultimo_andamento` and `ultima_consulta_inconclusiva` are **untouched** — the
  inertia rule never fires for them, so they generate no phantom "ligar no Balcão Virtual" tasks.
- **Excluded from the technical error email.** They are a known state, not a failure; including them
  would deliver an identical false alarm every week and train the recipient to ignore the report.

### 2.3 API
- `GET /radar/execucoes/:id` returns `total_pendente_implementacao` and the per-process rows.
- `GET /processos?status_radar=pendente_implementacao` lists exactly the 12.
- `POST /processos` **accepts** TJCE/TJBA — registering one is valid and expected.

### 2.4 Frontend (contract only — not built here, DEC-14)
The radar surface must render a distinct, non-alarming state: *"Aguardando scraper — TJCE"*, visually
separate from `erro`/`timeout`. It is **neutral**, not red: nothing is broken. The run summary shows
`94 consultados · 12 aguardando scraper`.

### 2.5 Metrics / observability
- `total_pendente_implementacao` is a first-class counter (15 §8) so coverage stays permanently visible.
- **Excluded** from the captcha-rate and degradation alerts (FR-41/FR-42).
- A **rising** count means new processes were registered for an unimplemented tribunal — worth
  surfacing, not alerting.

### 2.6 Tests
| ID | Assertion |
|---|---|
| TEST-RADAR-16 | Reserved slot → `pendente_implementacao`; **run does not fail**; counter increments |
| TEST-RADAR-31 | **A full 106+12 run completes `concluida`** with 12 pending: `taxa_conclusiva` excludes them, no inertia task, no email entry, baselines untouched |
| TEST-RADAR-24 | `tribunal_sigla` rejects typos, so a mistyped tribunal cannot masquerade as pending forever |

### 2.7 Documentation
`README` and the run report state plainly: *"v1 monitors TJSP. TJCE (7) and TJBA (5) are registered
and reported as awaiting a scraper."* Never phrased as an error or a defect.

## 3. Confirmation — the 12 do not fail the run

Chain of guarantees, each independently enforced:

1. `resolver()` returning `None` is a **normal branch**, not an exception (15 §3).
2. The orchestrator `continue`s; per-process isolation means nothing propagates (FR-24).
3. Excluded from `taxa_conclusiva` → cannot drag a healthy run to `falhou_parcialmente` (15 §6).
4. Excluded from the error email → no recurring false alarm (FR-25).
5. Baseline untouched → no inertia tasks (DEC-19).
6. **TEST-RADAR-31 asserts the end-to-end result:** a run of 106 TJSP + 12 pending finishes
   `concluida`.

## 4. Promotion path (when Gabriel supplies a scraper)

1. Add `radar/scrapers/tjce.py` implementing `ScraperTribunal` (15 §2).
2. Change `"TJCE": None` → `"TJCE": TJCEScraper()` in the registry.
3. Add golden fixtures for its layouts, mirroring `vendor/fixtures/`.

Orchestration, persistence, comparison, task generation, scheduling, email and metrics are
**untouched**. That is what the seam was for.

## 5. Requirements

| ID | Requirement | Verification |
|---|---|---|
| FR-18 | Unimplemented tribunals record `pendente_implementacao` without breaking the run | TEST-RADAR-16 |
| **FR-45** | **A complete run with 12 pending processes finishes `concluida`** — excluded from success rate, error email, inertia and alerts | **TEST-RADAR-31** |
