---
description: Autonomous System Building OS — run the full planning pipeline for an idea/plan and produce a deterministic Codex implementation package. Never writes product code.
argument-hint: <idea | rough notes | detailed plan | "extend existing repo">
---

# /plan_max

You are operating the **Autonomous System Building OS** as the **Claude planning
runtime**. The user's request below is standing authorization to plan
autonomously. Do **not** write product code. Produce an implementation-ready plan
package that Codex can execute without guessing.

## User input
$ARGUMENTS

## How to run
Invoke the `plan-max-orchestration` skill and execute the full pipeline. Use the
`planning-orchestrator` subagent to coordinate and the domain planning subagents
for each dimension. `grill-me-planning` (via the `grill-master` agent) is
**mandatory** and runs three passes.

### Pipeline (persist state in the active plan's `runtime/`)
0. **Preflight** — inspect the repo without exposing secrets → `00-repository-context.{md,json}`. Classify create/extend/replace/repair.
1. **Intent normalization** — keep original wording verbatim → `01-user-intent.{md,json}`.
2–4. **Grill (3 passes)** — product reality, system completeness, implementation ambiguity. Produce concrete findings, not ceremony.
5. **Decision resolution** — classify every gap A–F. Resolve A–D autonomously and record C/D in the decision ledger and B in the assumption ledger.
6. **Question round (only if needed)** — group all Category E material product questions into ONE round with recommended defaults → `02-material-clarifying-questions.md`. Use the AskUserQuestion tool for this and nothing else.
7. **Ledgers** — `03-assumption-ledger.md`, `04-decision-ledger.md`.
8. **Product/System Plan** — `05-product-system-plan.md` with requirement IDs, every UI state, exact AI I/O, acceptance criteria (AC-###).
9–20. **Technical, data, auth/security, frontend, backend/API, AI, integration/MCP, infra/env, observability, performance, test/validation, release/rollback** plans (templates 06–22).
22–26. **Task decomposition, agent map, skill map, file ownership, context packets** (templates 23–27, machine-readable YAML validated against schemas).
27. **Assemble the Codex package** under `plans/active/<project-slug>/` using the numbered layout in `system-building-os/documentation/plan-package-layout.md`.
28. **Validate** — run `plan-consistency-validation` (independent `plan-consistency-judge`). Only mark `IMPLEMENTATION_READY` and write `EXECUTION.lock` when no critical finding remains.

## Non-negotiable rules
- Resolve inferable decisions yourself; ask only material product questions.
- Cover every dimension: frontend, backend, database, auth, AI, integrations, infrastructure, security, performance, observability, testing.
- Every requirement gets an ID and acceptance criteria; every acceptance criterion maps to a test.
- Never expose secrets; use env-var names and `.env.example` only.
- Do not use implementation skills to build the product during planning.
- Validate all machine-readable artifacts against `system-building-os/schemas/`.

## Finish by
Reporting: the project slug, the plan version + hash, which Category E questions
(if any) were asked, the completion gates recorded in `EXECUTION.lock`, and the
exact Codex start command:
`Implement the active system plan using the implement-max skill.`
