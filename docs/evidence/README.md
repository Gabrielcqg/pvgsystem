# Pavageau Backend Evidence Index

This directory contains implementation evidence for the active plan:

- Slug: `pavageau-sistema-integrado-backend`
- Version: `2.5.1`
- Plan hash: `sha256:9f9fe612f27977042e46edf34a7ce4daae5eb0f11b0f0aa501268f08514ba36c`

## Local Setup

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-dev.txt
docker compose up -d db
MIGRATION_DATABASE_URL=postgresql://postgres:postgres@localhost:54329/pavageau .venv/bin/python -m app.db.migrate
DATABASE_URL=postgresql://postgres:postgres@localhost:54329/pavageau .venv/bin/python -m pytest -q
```

The official migration source is `supabase/migrations/`. The local runner skips
only the Supabase platform baseline dump when targeting vanilla Docker Postgres
and applies the product migrations from the same official directory.

Run the API locally:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:54329/pavageau .venv/bin/uvicorn app.api.main:app --host 127.0.0.1 --port 8000
```

## Evidence Files

- `acceptance-evidence.json`: requirement and acceptance-criterion coverage.
- `plan-hash-validation.json`: active metadata/lock hash validation and current hash-method limitation.
- `test-results.json`: validation command evidence.
- `scraper-characterization.json`: protected TJSP scraper hash and branch characterization.
- `tribunal-scope.json`: TJSP implemented, TJCE/TJBA pending behavior.
- `EVID-01-local-production-like-run.json`: clean local production-like verification.
- `deviations.json`: reversible implementation deviations.
- `external-blockers.json`: external dependencies, including EXT-DEP-01.
- `final-acceptance-judge.json`: independent judge output.

The final implementation report is generated at:

`plans/active/pavageau-sistema-integrado-backend/runtime/final-implementation-report.json`
