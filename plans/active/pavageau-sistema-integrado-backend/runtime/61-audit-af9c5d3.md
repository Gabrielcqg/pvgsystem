# 61 — Plan Audit at commit `af9c5d3b` (2026-07-21)

Reconciles plan **v3.1.0** to HEAD **`af9c5d3b8970f5012189c2b6b9ce08775249016c`**
("Support Supabase ES256 JWTs in Docker API"). Verified against files on disk.

## 1. Newly DONE since v3.1.0 — the JWKS/ES256 auth rework

`app/db/session.py` now implements the auth rework that v3.1.0 carried as **remaining** work (T-BE-2 /
FR-068 / DEC-44). Verified:

- **ES256/RS256 via JWKS.** `pyjwt` (PyJWK) + `_load_jwks()` (well-known JWKS URL, 600s cache),
  `ASYMMETRIC_ALGORITHMS = {ES256, RS256}`, signature verified with the asymmetric key.
- **Issuer checked** (`_validate_claims(..., issuer=_expected_issuer(supabase_url))`), plus `exp`, `nbf`,
  `sub`, and `role ∈ {authenticated}`.
- **HS256 compatibility** retained (`_verify_hs256`).
- **401≠403** in the API (`main.py`: 401 on missing/invalid token; app_members/RLS yields the 403 path).
- `main.py:64` passes both `jwt_secret` and `supabase_url` to the validator.
- **46 tests pass** (brief); `tests/api/test_api_contract.py` covers the auth contract.
- Docker: `Dockerfile.api` + `docker-compose.yml` present.

**Action: T-BE-2 (TASK-802 / FR-068) reclassified DONE → VERIFY-PRESENT.** It is no longer build work.
DEC-44 is satisfied; `51 §2.1` and `runtime/60 FINDING-A` updated to "implemented".

## 2. Residual auth findings (verify/hardening — NOT user questions, `codex_questions_required` stays 0)

These do not reopen the decision; they are items for the frontend-integration phase to confirm against
the deployed config. Framed as code-read/deploy checks, not questions.

### FINDING-J1 (MAJOR — deployment) — signature verification is gated on `SUPABASE_JWT_SECRET`
`parse_jwt_claims` runs its verification block only inside `if jwt_secret:`. If `SUPABASE_JWT_SECRET` is
**unset**, a well-formed token is returned with `role=authenticated` **without any signature check**
(`session.py`: `claims.setdefault("role","authenticated"); return claims`). In an ES256-only Supabase
project the operator may not set the legacy HS256 secret — in which case auth **fails open**.

**Resolution (deploy non-negotiable, no code decision for the user):** the deployed API **must** run with
`SUPABASE_JWT_SECRET` set (any non-empty value is enough to reach the ES256/JWKS branch, which then
ignores it for asymmetric tokens), **or** the backend-completion task should drop the `if jwt_secret:`
gate so asymmetric verification runs whenever `SUPABASE_URL` is present. Recorded as a deployment
non-negotiable in `17-deployment-and-configuration.md` and a hardening item on the `/me` slice (T-BE-1).

### FINDING-J2 (MINOR) — `aud` (audience) is not validated
`_verify_asymmetric` sets `options={"verify_aud": False, …}` and `_validate_claims` does not check `aud`.
DEC-44 listed `aud` among the validated claims. Low risk (issuer + signature + role are checked), but the
`/me`/auth-hardening slice should add an `aud == "authenticated"` check to match DEC-44.

## 3. Unchanged and still valid

- **Backend-completion (T-BE-1) endpoints are STILL all genuinely missing.** Authoritative `@app` route
  count = 19; **`/me` has 0 references**; no CRUD roots for parceiros/contratos/lançamentos/tarefas/
  custos-fixos, no processos list/create/delete, no `/radar/*` run endpoints, no `/auditoria`. The ES256
  commit was auth-only and added no endpoint. The backend-completion list (`51 §3`, `runtime/60 §4`)
  remains accurate; **no duplication of any live route** (re-verified).
- **Frontend tasks unchanged** — they consume the now-working auth; no rework.
- **Migrations:** `supabase/migrations/` (5 files) is the sole source; legacy `migrations/` removed —
  already reflected (DEC-51). No new migration this commit.
- **Scraper** frozen, hash `c9429f2a…` intact.
- **Backend Phases 0-6** remain implemented (verify-present).

## 4. Observation (not a plan issue)
Local HEAD is **2 commits ahead** of the last-fetched `origin/main` (`83fa313`). The brief states the
backend is pushed; the local remote-tracking ref is likely stale (needs `git fetch`). Not a plan blocker
— the plan reconciles to the working tree at `af9c5d3b`.

## 5. Ready-conditions (brief)
- synced to `af9c5d3b` — **YES** (HEAD == target).
- JWKS/ES256 + HS256 not re-planned — **YES** (T-BE-2 → verify-present/DONE).
- backend preserved — **YES** (Phases 0-6 verify-present; migration rule).
- backend-completion only genuinely-missing endpoints — **YES** (19 routes; `/me` still absent).
- `codex_questions_required` = 0 — **YES** (J1/J2 are deploy/code-read items, not questions).
