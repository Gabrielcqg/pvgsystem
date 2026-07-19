# 05 — Product & System Plan

**Sistema Integrado Pavageau — backend and database.** Frontend is out of build scope (DEC-14) and is
consumed as the API contract from `vendor/frontend/FRONTEND_REFERENCE_PAVAGEAU.md`.

---

## 1. Problem

The office runs on two hand-maintained Excel workbooks that accumulated defects discipline cannot
fix: monthly cash typed over formulas breaking the balance chain; the same status spelled several
ways and counted separately; ~15 spellings for 8 fee types; a partner with active contracts invisible
on the dashboard; 4 clients with instalments but no contract row.

## 2. Governing rule

**No number is entered twice.** The user enters only primary facts — contracts, instalments, cash
entries, fixed costs, processes. Everything else (cash balance, DRE, balance sheet, projections,
default, conversion) is **derived**, materialized for instant reads, and **never editable**.

The defect is eliminated *by construction*: there is no column, endpoint or grant through which a
calculated value can be written. See `07-data-architecture-plan.md` §4–§6 and NFR-01.

## 3. Three pillars

| Pillar | Covered by |
|---|---|
| **Financeiro** — from entry to balance sheet | `lancamentos` + the calculation engine + the chained monthly balance |
| **Contratos & Honorários** — proposal to closure, monthly analyses, default, projections | `contratos` + `parcelas` + derived formulas (07 §5) |
| **Radar Processual** — weekly sweep, "did it move?", task on demand, 30-day stall rule | `15-integration-plan.md` + `20-tribunal-scope.md` |

## 4. Scope

**In v1:** database, calculation engine, REST API, Supabase Auth + RLS, audit trail, TJSP radar,
spreadsheet loader.

**Out of v1:** frontend build (DEC-14); TJCE and TJBA scrapers (DEC-38 — 12 processes, reported as
`pendente_implementacao`, never failing a run); AI (deterministic product); multi-role authorization
(RLS leaves the path open).

## 5. Business rules

| ID | Rule |
|---|---|
| BR-01 | `percentual_quota` is the **partner's** share: office success = `valor_causa × %exito × (1 − quota)` |
| BR-02 | An instalment confirmation and its cash entry commit together or not at all |
| BR-03 | A fixed cost cannot post twice in the same competence month (`custo_id:YYYY-MM`) |
| BR-04 | A new movement becomes a task **only by human curation**; the 30-day stall rule fires **automatically and idempotently** |
| BR-05 | A `timeout` means "unknown", never "no movement": it does not advance the inertia clock nor clear the baseline |
| BR-06 | Only the 3 most recent movements are compared, by deterministic key |
| BR-07 | Deleting a contract must explicitly decide the fate of its instalments (409 + `?cascade=`) |
| BR-08 | Materialized values are rewritten in the same transaction as the fact that changed |

## 6. Requirements and acceptance

51 functional + 14 non-functional requirements, each with acceptance criteria and verification —
`44-vertical-traceability.md` (prose) and `vertical-traceability.yaml` (machine-readable).
**65 requirements, 65 verified, 0 unverified.**

## 7. Success

The office enters only facts; reports open instantly and provably equal a from-scratch
recomputation; no calculated value is writable; the weekly radar runs unattended over 106 TJSP
processes and reports the 12 out-of-scope ones as pending without failing.
