# 09 — Auth, Authorization & Security Plan

Supabase Auth, single office account, no roles, no MFA for now (DEC-02). Authorization is **RLS**,
delivered as SQL files ready to paste.

---

## 1. Authentication

Supabase Auth owns user credentials. The application never stores or hashes a user password.
Email + password, session via Supabase JWT. Sign-up is **disabled in the dashboard** after the
office account is created — otherwise "single office login" is a convention, not a control, and
anyone with the anon key could self-register into a law firm's financial system.

## 2. Authorization baseline

Nothing is public. Every table: RLS **enabled**, and the baseline policy is
`TO authenticated USING (true)` for read/write — one office, one trust boundary, no row filtering yet.

```sql
ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;
CREATE POLICY contratos_rw ON contratos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

**Why `true` is correct here and not laziness:** with one account there is no row-level distinction
to draw. The value is structural — RLS is *on* everywhere, so introducing roles later means adding
`USING` clauses, never retrofitting RLS onto tables that shipped without it. That retrofit is the
expensive, dangerous migration this avoids.

**Forward path (DEC-02):** a `perfis(user_id, papel)` table plus predicates like
`USING (papel() = 'financeiro')`. Policies change; the backend does not.

## 3. Deviations from the baseline — where `true` is wrong

| Table | Policy | Reason |
|---|---|---|
| `auditoria` | `INSERT` only. **No** UPDATE/DELETE policy exists. | Insert-only trail (DEC-07). Absent policy = denied by default. A `BEFORE UPDATE OR DELETE` trigger raises as a second layer. |
| All six `ind_*` tables | `SELECT` only for `authenticated`; write privileges `REVOKE`d | **DEC-04.** Written solely by `SECURITY DEFINER` recalculation functions. The user cannot overwrite a calculated number because no grant permits it — a privilege fact, not a UI convention. **This control is only real if the API connects as the caller, not `service_role`** (DEC-28), which is why TEST-SEC-05 asserts it. |
| `processos.senha_ref` | **Column-level `REVOKE SELECT (senha_ref)` from `authenticated`** — SELECT specifically, since `PUT /processos/:id/senha` writes it as the caller (DEC-28), plus omission from every response model | RLS is row-level and cannot restrict a column, so the v1.0 wording was unimplementable. The exposure that matters is not anon (already denied everything by NFR-05) but an **authenticated** user reading the column under `USING (true)` — closed by a column `REVOKE` and by response allowlists (DEC-34). |
| `execucoes_radar`, `resultados_consulta`, `movimentacoes_novas` | `SELECT` for `authenticated`; **`INSERT`/`UPDATE` only `TO radar_worker`** | The worker writes these; a user must never hand-author a run result. |

### 3.1 `radar_worker` — the role must be created AND admitted by policy

`radar_worker` is a plain Postgres role (DEC-28): not `authenticated`, not a table owner, and
**without `BYPASSRLS`**. That has a consequence that is easy to miss and fatal in practice:

> **RLS denies by default.** A role holding `GRANT`s but matched by **no policy** reads **zero rows**
> and fails every write check. Since every baseline policy in §2 is written `TO authenticated`,
> `radar_worker` would be locked out of the entire database and the orchestrator would not run at all.

So the role needs explicit policies, not just grants. `010_radar_role.sql` (T-019):

```sql
CREATE ROLE radar_worker LOGIN;   -- password from RADAR_DB_URL, set out of band

-- INVARIANT: every object granted below has a matching policy below. A grant without a policy is
-- worse than no grant — it reads zero rows SILENTLY instead of erroring.
GRANT SELECT, INSERT, UPDATE ON execucoes_radar, resultados_consulta, movimentacoes_novas TO radar_worker;
GRANT SELECT ON configuracoes TO radar_worker;
-- The orchestrator UPDATEs processos (baseline, last movement, inconclusive flag) and INSERTs
-- inertia tasks. A SELECT-only grant here would break §6 of the integration plan.
-- `senha_ref` is deliberately NOT granted: only the API writes it (13 §4). The worker READS it
-- to resolve the vault, which the SELECT grant already covers.
GRANT SELECT, UPDATE (chaves_movimentacoes, data_ultimo_andamento, ultima_consulta_status,
                      ultima_consulta_em, ultima_consulta_inconclusiva, exige_senha)
  ON processos TO radar_worker;
-- SELECT is required, not optional: aplicar_regua_inercia() must check for an existing open task
-- before inserting. Without it the check reads zero rows every run, the INSERT hits
-- ux_tarefa_inercia_aberta, and the whole inertia pass aborts — silently breaking FR-16.
GRANT SELECT, INSERT ON tarefas TO radar_worker;
GRANT INSERT ON auditoria TO radar_worker;

CREATE POLICY radar_rw    ON execucoes_radar      FOR ALL    TO radar_worker USING (true) WITH CHECK (true);
CREATE POLICY radar_rw    ON resultados_consulta  FOR ALL    TO radar_worker USING (true) WITH CHECK (true);
CREATE POLICY radar_rw    ON movimentacoes_novas  FOR ALL    TO radar_worker USING (true) WITH CHECK (true);
CREATE POLICY radar_proc  ON processos            FOR ALL    TO radar_worker USING (true) WITH CHECK (true);
CREATE POLICY radar_cfg   ON configuracoes        FOR SELECT TO radar_worker USING (true);
CREATE POLICY radar_task_r ON tarefas             FOR SELECT TO radar_worker USING (true);
CREATE POLICY radar_task_w ON tarefas             FOR INSERT TO radar_worker WITH CHECK (origem = 'radar_inercia');
CREATE POLICY radar_audit ON auditoria            FOR INSERT TO radar_worker WITH CHECK (true);
```

**No grant is issued on `ind_*`, `lancamentos`, `parcelas`, `custos_fixos`, `parametros`,
`parceiros`, `contratos` or `auth.*`.** The worker needs none of them: the client name it reports is
already denormalized onto `processos`, and the contract link is a FK it only reads through
`processos.contrato_id`.

`radar_task_w` constrains the worker to creating *inertia* tasks only — it cannot forge a curation
task that should have come from a human (DEC-06).

**TEST-SEC-07** asserts **both directions**:
- *Negative* — `ind_*`, financial tables, `parceiros`, `contratos` and `auth.*` are denied; `INSERT`
  into `tarefas` with `origem <> 'radar_inercia'` fails; `UPDATE processos.senha_ref` fails.
- *Positive symmetry* — **every object granted to `radar_worker` is actually usable by it.** Iterate
  the grants and assert each performs its granted operation. A grant with no policy fails this and
  would otherwise surface only as an empty result set at runtime, months later.

> Without this section, the likely shortcut is `ALTER ROLE radar_worker BYPASSRLS` or a fallback to
> `service_role` — which silently reinstates the exact defect DEC-28 exists to prevent, while
> TEST-SEC-05 (which only inspects the API path) stays green.

## 4. Secrets

| Secret | Storage | Rule |
|---|---|---|
| User passwords | Supabase Auth | Never in our code |
| **Process passwords (TJSP)** | **Supabase Vault** (`vault.secrets`); decryption key in KMS **outside** the database (DEC-27). Env: `VAULT_PROVIDER`, `SUPABASE_VAULT_KEY_ID` | DB stores `senha_ref = 'vault:<uuid>'` only. The property DEC-05 protects is that **a dump of the app database yields ciphertext**, which holds because the key is not in the database. `vault.py` exposes `guardar/resolver/remover` with one implementation, so switching to AWS Secrets Manager is one class — not worth a second cloud vendor, IAM and new network failure modes for 5 passwords today. |
| Supabase `service_role` key | Env var, **migrations only** (DEC-28) | Never client-side, never in the API, never in the worker — it bypasses RLS |
| `radar_worker` DB credentials | `RADAR_DB_URL`, worker only | Normal Postgres role with scoped grants |
| SMTP credentials | Env vars | — |
| `DATAJUD_API_KEY` (if ever used) | Env var, **no in-code default** (DEC-25) | Fail-fast on startup |

**`.env.example` carries names only, never values.**

Flow for a password-gated process, exactly as specified: the scraper hits the wall → records
`exige_senha = true`, status `senha_necessaria` → the process shows as "exige senha" in the UI → any
authenticated user registers the password → **only at confirmation** does it enter the vault and
`senha_ref` get written → the process becomes queryable on the next run. No automatic escalation, no
recurring reminder while it sits pending.

## 5. Leak surfaces closed explicitly

A password can escape through five channels. Each is closed by name:

1. **Logs** — the scraper's logger is wrapped with a redacting filter; `ProcessoConsulta.senha` is excluded from every `repr`/log line.
2. **API responses** — no serializer includes `senha_ref` or `senha`; response models are allowlists, not exclusions.
3. **Error email** — the report includes process number, status, message, step, timestamp only (as the document specifies), assembled from a fixed field list.
4. **Audit trail** — the writer strips keys matching `senha|password|token|secret` before insert. Without this, *registering* a password would log it in plaintext.
5. **Debug artifacts** — `salvar_diagnostico()` writes full-page HTML and PNG. It is **suppressed for processes carrying a password**: a screenshot of a filled password form is a leak that no amount of API hygiene catches.

Channel 5 is the one that survives a naive implementation, which is why it is called out as a
required change rather than left implicit.

## 6. Transport & least privilege

TLS everywhere (Supabase default). The radar worker connects as `radar_worker` (§3.1) with grants
limited to the tables it reads and writes — no DDL, no access to `auth.*`. The browser client uses
the anon key plus the user's JWT and can reach only what RLS permits.

## 7. Threat model — top risks

| # | Threat | Control |
|---|---|---|
| T1 | DB leak exposes process passwords | Vault separation (DEC-05); DB holds references only |
| T2 | Password leaks via screenshot/log/email/audit | Five channels closed above; redaction tested (TEST-SEC-03) |
| T3 | Calculated value overwritten, recreating the spreadsheet defect | No write grant on `ind_*`; no API path; TEST-CALC-07 |
| T4 | Anonymous access to financial data | RLS on every table; sign-up disabled; TEST-RLS-01 |
| T5 | Audit trail tampering | Insert-only policy + trigger; TEST-SEC-02 |
| T6 | Concurrent radar runs corrupting baselines | `pg_try_advisory_lock`; TEST-RADAR-10 |
| T7 | Instalment marked received with no matching entry (or vice versa) | Single transaction + `ck_recebido_coerente`; TEST-TX-01..03 |
| T8 | Timeout misread as "no movement" → false inertia tasks | DEC-19; TEST-RADAR-11 |
