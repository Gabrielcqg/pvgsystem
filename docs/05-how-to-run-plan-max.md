# How to Run /plan_max
In Claude Code: `/plan_max <idea | rough notes | detailed plan | "extend repo">`.

`/plan_max` is a **closed loop**. You do not need to remember any follow-up
command. In one invocation Claude:
1. inspects the repo (and any `project-reference/frontend/`);
2. runs the three-pass grill **and** the product-logic & intelligence grill
   (deciding what AI vs deterministic logic owns);
3. resolves inferable decisions autonomously and asks only material product
   questions (Category E), grouped — including material visual-identity choices;
4. produces the product, backend, data, auth, AI, and **detailed frontend** plans
   (frontend reference intake → frontend grill → screen/interaction contracts);
5. plans the **real AI provider integration** when AI is central;
6. reconciles every requirement across all applicable layers into
   `vertical-traceability.yaml`;
7. writes the implementation-deliverables and production-readiness contracts;
8. assembles the package with all implementation gates **PENDING**;
9. runs the **embedded independent audit** (`/plan_audit` behavior), auto-repairs
   critical/major findings, recomputes the hash, and re-audits until clean;
10. only then marks `IMPLEMENTATION_READY` and prints the plan version, the
    planning gates, and the Codex start command.

`/plan_audit` is **not required** after a successful `/plan_max`. Optional
deepening commands (`/plan_frontend_max`, `/plan_backend_max`, `/plan_ai_max`,
`/plan_data_max`, `/plan_reconcile`) are refinements only — their essential
behavior already runs inside `/plan_max`.

"Production-ready" means a complete vertical product (see
`system-building-os/policies/production-ready.md`): frontend is mandatory when
there is a UI, database when there is persistence, auth when access is private, and
the real AI path when the product's value depends on AI. `/plan_max` never writes
product code.
