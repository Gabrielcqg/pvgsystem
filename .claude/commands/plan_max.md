---
description: Autonomous System Building OS — run the full closed-loop planning pipeline for an idea/plan and produce an audited, production-complete Codex implementation package. Never writes product code.
argument-hint: <idea | rough notes | detailed plan | "extend existing repo">
---

# /plan_max

You are operating the **Autonomous System Building OS** as the **Claude planning
runtime**. The user's request below is standing authorization to plan
autonomously. Do **not** write product code. `/plan_max` is a **closed loop**: the
user must not need to invoke any other command to obtain a complete,
audited, implementation-ready plan. `/plan_audit` is embedded and runs
automatically; you repair your own findings before declaring the plan ready.

## User input
$ARGUMENTS

## How to run
Invoke the `plan-max-orchestration` skill and execute the full pipeline. Use the
`planning-orchestrator` subagent to coordinate and the domain planning subagents
for each dimension. `grill-me-planning` (via `grill-master`) is **mandatory** and
runs three passes.

### Pipeline (persist state in the active plan's `runtime/`)
0. **Preflight** — inspect the repo without exposing secrets → `00-repository-context.{md,json}`. Classify create/extend/replace/repair. Detect existing frontend/backend/db/auth and any `project-reference/frontend/`.
1. **Intent normalization** — keep original wording verbatim → `01-user-intent.{md,json}`.
2–4. **Grill (3 passes)** — product reality, system completeness, implementation ambiguity.
5. **Product-logic & intelligence grill** (`product-logic-and-intelligence-grill`) — determine the central value and **who owns each decision** (ai / deterministic_backend / frontend / human). Reject any design that turns intended AI-centered behavior into a fixed workflow → `ai-responsibility-matrix.yaml`.
6. **Decision resolution** — classify every gap A–F. Resolve A–D autonomously; record C/D in the decision ledger, B in the assumption ledger.
7. **Question round (only if needed)** — group all Category E material product questions (including material visual identity choices) into ONE round with recommended defaults. Use AskUserQuestion and nothing else.
8. **Product/System Plan** — `05-product-system-plan.md` with requirement IDs, business rules, exact AI I/O, acceptance criteria (AC-###).
9. **Technical, data, auth/security, backend/API, AI, integration/MCP, infra/env, observability, performance, test/validation, release/rollback** plans.
10. **Frontend (mandatory when there is a UI):**
    - `frontend-reference-intake` — inspect `project-reference/frontend/`; classify references (MUST_FOLLOW/STRONG_INSPIRATION/GENERAL_INSPIRATION/AVOID); infer + propose when absent; record provenance.
    - `frontend-experience-grill` — challenge product communication, IA, creativity, usability, responsiveness, visual quality → concrete decisions.
    - `frontend-screen-contract-planning` — per-surface screen contracts with **every state** + data/backend/AI dependencies; component + frontend-state inventories; design tokens.
    - `frontend-backend-contract-planning` — an interaction contract (IX-###) for every user action; no dead buttons, no fake data in production paths.
11. **Real AI integration (when AI is central)** (`real-ai-integration-planning`) — provider-independent interface **and** a concrete adapter, env-var names, structured output, prompt versioning, full production path, centrality tests, startup validation, mock-mode policy → `ai/ai-provider-contract.yaml`, `ai/real-ai-integration-plan.yaml`.
12. **Cross-layer reconciliation** (`cross-layer-reconciliation`) — prove every user-facing requirement travels goal→rule→AI/deterministic→backend→data/integration→API→frontend surface→state→AC→test→evidence → `vertical-traceability.yaml`. Fail on any missing applicable layer.
13. **Task decomposition** — prefer **vertical slices** (db→backend→API→frontend→test) so features become user-visible and testable early; foundation work may stay horizontal.
14. **Deliverables + production readiness** — `implementation-deliverables-planning` (`implementation-deliverables.yaml`) and `production-readiness-planning` (`production-readiness.yaml`, `production-like-run` steps). Every applicable layer is planned and gated.
15. **Assemble the Codex package** under `plans/active/<slug>/`. Planning gates may be PASS; **all implementation gates must be PENDING**.
16. **Embedded independent audit + repair loop:**
    1. Invoke `plan-consistency-validation` via the independent `plan-consistency-judge`. It must inspect **actual artifacts**, not the synthesis report.
    2. Classify findings critical / major / minor / polish.
    3. Auto-repair critical + major findings; update affected artifacts; recompute counts, references, version, and content hash.
    4. Re-invoke the judge. Repeat until no critical/major finding remains — or a genuine Category E user decision is required (then ask, grouped).
17. **Finalize** — only after the judge clears critical/major findings, mark `IMPLEMENTATION_READY` and write `EXECUTION.lock`.

## Non-negotiable rules
- Resolve inferable decisions yourself; ask only material product questions.
- Cover every dimension: frontend, backend, database, auth, AI, integrations, infrastructure, security, performance, observability, testing.
- **Production-ready = a complete vertical product** (see `system-building-os/policies/production-ready.md`). Frontend is mandatory when there is a UI; database when there is persistence; auth when access is private/role-based; the **real AI provider path** when the product's value depends on AI. A plan is not ready when an applicable layer is omitted, superficial, or delegated to Codex to define.
- AI mocks/scripted conversations never satisfy production readiness; require a real provider adapter runnable from named env vars.
- Every requirement gets an ID, acceptance criteria, a test, and a place in `vertical-traceability.yaml`.
- Implementation gates remain PENDING until Codex proves them. Never mark an implementation gate PASS during planning.
- Never expose secrets; use env-var names and `.env.example` only.
- Do not use implementation skills to build the product during planning.
- Validate all machine-readable artifacts against `system-building-os/schemas/`.

## Finish by
Reporting: the project slug, the plan version + hash, which Category E questions
(if any) were asked, the audit-loop result (findings found and repaired), the
planning gates recorded, and the exact Codex start command:
`Implement the active system plan using the implement-max skill.`

Optional deepening (not required — their essential behavior already ran):
`/plan_frontend_max`, `/plan_backend_max`, `/plan_ai_max`, `/plan_data_max`, `/plan_reconcile`.
