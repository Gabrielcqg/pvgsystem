# 17 — Deployment, Region & Runtime Identity

Closes the region decision, the spreadsheet dependency's deployment side, and the worker-identity model. **Nothing here is
a question for Codex.**

---

## 1. Region — RESOLVED (DEC-35)

**Decision: `sa-east-1` (São Paulo), expressed as validated configuration, not as a hardcoded value.**

`AWS_REGION` is a required, validated configuration parameter with the default `sa-east-1`.

```python
# app/config.py
AWS_REGION: str = Field(default="sa-east-1")           # Supabase project region
ALLOWED_REGIONS = {"sa-east-1", "us-east-1", "us-west-1", "eu-central-1"}

@field_validator("AWS_REGION")
def _validate_region(cls, v: str) -> str:
    if v not in ALLOWED_REGIONS:
        raise ValueError(f"AWS_REGION={v!r} invalid; expected one of {sorted(ALLOWED_REGIONS)}")
    return v
```

Startup **fails fast** on an invalid region rather than provisioning into the wrong jurisdiction.

**Rationale (LGPD).** Data subjects are Brazilian clients of a Brazilian law firm; the records include
process numbers, party names and fee amounts. LGPD does not forbid international transfer, but
hosting in Brazil removes the need for a documented transfer basis and simplifies any answer to a
client or the OAB about where process data lives. `sa-east-1` is therefore the default, and moving
off it is a deliberate act requiring an explicit env override.

### 1.1 Local and development are NOT blocked by this

| Environment | Database | Region relevance |
|---|---|---|
| **Local** | Docker Postgres 16 (`docker compose up db`) | **None.** `AWS_REGION` unused. |
| **Test / CI** | Ephemeral Postgres container | **None.** |
| **Staging / Production** | Supabase project | `AWS_REGION` selects the project region |

Migrations `000`–`010` run against local Postgres (`000_bootstrap.sql` supplies the `auth` stub and
`authenticated` role, DEC-30). `011_watchdog.sql` is Supabase-only and is **skipped locally** by a
guarded runner:

```sql
-- 011_watchdog.sql
DO $$ BEGIN
  IF current_setting('server_version_num')::int > 0
     AND EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
    CREATE EXTENSION IF NOT EXISTS pg_cron;
    CREATE EXTENSION IF NOT EXISTS pg_net;
    PERFORM cron.schedule('refresh-painel',      '0 4 1 * *', $$SELECT refresh_painel()$$);
    PERFORM cron.schedule('watchdog-sem-rodada', '0 5 * * *', $$SELECT notificar_sem_rodada()$$);
  ELSE
    RAISE NOTICE 'pg_cron unavailable — skipping scheduler (expected on local Postgres)';
  END IF;
END $$;
```

**Codex implements every phase, end to end, with zero region input.** `GATE-SCHEMA` is proven twice:
once on local Postgres (migrations `000`–`010`) and once on Supabase (`000`–`011`).

### 1.2 External deployment dependency (not a Codex question)

| ID | Dependency | Owner | Blocks | Does NOT block |
|---|---|---|---|---|
| **EXT-DEP-01** | Create the Supabase project in `sa-east-1`; supply `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RADAR_DB_URL` | Gabriel (account owner) | Production provisioning; `GATE-PROD-RUN` | Every phase 0–6; all tests; local `GATE-SCHEMA` |

This is an **operator action on an external SaaS account**, not a design decision. Codex cannot
perform it and must not wait on it: it builds and verifies everything against local Postgres, and
production apply happens when EXT-DEP-01 is satisfied.

---

## 2. Runtime identity — three separate identities (DEC-28, DEC-36)

| Identity | Used by | Auth | RLS | Scope |
|---|---|---|---|---|
| **Caller JWT** | FastAPI user request handlers | Supabase Auth JWT, forwarded to Postgres | **Applies** | Everything the office user may touch |
| **`radar_worker`** | Scheduled + manual radar runs | Postgres role, `RADAR_DB_URL` | **Applies** (explicit policies) | Radar tables only |
| **`service_role`** | **Migrations only** | Supabase service key | Bypasses | DDL |

**Why three and not one.** `service_role` bypasses RLS, so it can never be least-privilege. If the
API used it, the `REVOKE` on `ind_*` would sit on a role nobody connects as — NFR-01 and threat
control T3 would read as satisfied while being unenforceable. The worker gets a real Postgres role
for the same reason.

### 2.1 `radar_worker` — complete model

Full DDL in `09-auth-authorization-plan.md` §3.1 (`010_radar_role.sql`, T-019).

| Aspect | Definition |
|---|---|
| **Role** | `radar_worker`, `LOGIN`, **no `BYPASSRLS`**, not a table owner, not `authenticated` |
| **Credential** | `RADAR_DB_URL` (env var, worker host only). Never client-side, never in the API container, never logged. Rotated by changing the role password — no code change. |
| **Permitted writes** | `INSERT`/`UPDATE` on `execucoes_radar`, `resultados_consulta`, `movimentacoes_novas`; `UPDATE` on 6 named `processos` columns; `INSERT` on `tarefas` restricted to `origem='radar_inercia'`; `INSERT` on `auditoria` |
| **Permitted reads** | Those tables plus `configuracoes` |
| **Explicitly denied** | All six `ind_*`; `lancamentos`, `parcelas`, `custos_fixos`, `parametros`, `contratos`, `parceiros`; `auth.*`; **`processos.senha_ref` UPDATE** (only the API writes it); any DDL |
| **Tenant scope** | Single-tenant (one office, DEC-02). Policies are `USING (true)` **scoped by role**, not by tenant. When roles are introduced, `radar_worker`'s policies are unaffected — it is orthogonal to the user-facing model. |
| **Audit behavior** | Every run start/finish, every process deletion consequence and every auto-created inertia task writes to `auditoria` with `usuario_id = NULL` and an explicit actor marker, so machine-originated rows are distinguishable from human ones (TEST-AUD-06) |
| **Grant/policy symmetry** | **Every granted object has a matching policy.** A grant without a policy reads zero rows *silently*. TEST-SEC-07 asserts both directions. |

### 2.2 Secret inventory — names only

| Env var | Consumer | Notes |
|---|---|---|
| `AWS_REGION` | provisioning | default `sa-east-1`, validated |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | API | public-side |
| `SUPABASE_SERVICE_ROLE_KEY` | migrations only | never in API/worker runtime |
| `RADAR_DB_URL` | worker only | `radar_worker` credential |
| `VAULT_PROVIDER`, `SUPABASE_VAULT_KEY_ID` | vault adapter | DEC-27 |
| `SMTP_*` / `RESEND_API_KEY` | error report + watchdog | — |

`.env.example` carries these **names with empty values**. No secret appears in this package.

---

## 3. Environments

| Environment | Compute | Database | Scheduler |
|---|---|---|---|
| Local | `docker compose` | Postgres 16 container | disabled (`pg_cron` absent — guarded) |
| CI | GitHub Actions | ephemeral Postgres service | disabled |
| Production | API container + radar worker host (DEC-23) | Supabase `sa-east-1` | `pg_cron` + host `launchd`/cron |

The radar worker needs a real browser (DrissionPage/Chrome). Default host is the office Mac — the
exact environment where 106 processes ran with 0 captcha timeouts. Moving to a VPS with Chrome+Xvfb
is **deployment configuration**, not architecture, because the worker holds no local state and talks
to Supabase over the network. `GATE-PROD-RUN` re-proves the run on whichever host is chosen, since a
datacenter IP is an unproven variable for captcha behavior.
