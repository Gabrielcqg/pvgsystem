# 29 — Codex Start

**Plan version:** v2.5.1 · verify `PLAN_METADATA.yaml.content_hash` == `EXECUTION.lock.active_plan_hash` before starting.

```
Implement the active system plan using the implement-max skill.
```

## Before the first line of code

1. Read `28-codex-handoff.md` (non-negotiables, start task, deliverables).
2. Read `vendor/PROVENANCE.md`. **The canonical scraper is already in this package** — do not search
   `~/Downloads`, do not choose between copies.
3. Verify the plan hash: `PLAN_METADATA.yaml.content_hash` must equal `EXECUTION.lock.active_plan_hash`.

## First task — T-004

Characterization tests against the already-versioned canonical scraper:

| | |
|---|---|
| File | `vendor/scraper/consulta_tjsp_lote.py` |
| SHA-256 | `c9429f2aa3ac05a30fe53075ce56fb2def63e5cc82f229a0531b94ba73701ad8` |
| Fixtures | `vendor/fixtures/html/` (5) + `vendor/fixtures/golden-extraction.json` |

Write **TEST-SCRAPER-01** (hash pin), **TEST-SCRAPER-02** (`eproc_eventos` golden),
**TEST-SCRAPER-03** (`container_movimentacao` golden) and **TEST-ARCH-01** (import-graph) first.
The two layout branches carry **all 94** production successes (51 + 43); until these are green,
`GATE-SCRAPER-FROZEN` is unenforceable.

## Nothing blocks you

No unresolved decision. No external file. No question to ask.

`EXT-DEP-01` (Supabase project + keys, Gabriel's operator action) gates **production apply and
`GATE-PROD-RUN` only**. Build and verify every phase on the local Postgres stack
(`docker compose up db`, migrations `000`–`010`). Complete all phases, stop before production apply,
report readiness. **Do not wait. Do not ask.**

## Order

Phase 0 (vendor intake + characterization) → 1 (schema) → 2 (calculation) → 3 (domain/API) and
4 (radar, parallel) → 5 (hardening) → 6 (loader, synthetic fixtures).

## Definition of done

All gates green except `GATE-PROD-RUN`. All **66** requirements carry verification: 65 automated, 1 (NFR-12) by evidence procedure EVID-01.
**79 acceptance criteria, all owned by a task. 62 tasks with `phase` + `dependencies`.**
