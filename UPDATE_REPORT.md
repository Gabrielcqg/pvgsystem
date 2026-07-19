# Update Report — /plan_max Production-Complete Planning & Implementation Contract

OS version **1.0.0 → 1.1.0**. This upgrade makes `/plan_max` a closed-loop,
self-auditing, production-oriented planning pipeline. No product was implemented.
All changes were made to the **canonical source** (`system-building-os/` + generator
scripts) and projected into the `.claude` / `.codex` / `.agents` adapters.

**Validation:** `python3 tests/run_all.py` → **14/14 suites pass** (schemas 80/80,
state-machine 221/221, agent-contracts 973/973, skill-contracts 2304/2304,
runtime-parity 119/119, runtime-config 22/22, both plan packages 127/127,
dry-run 77/77, completion-gates 8/8, production-complete 69/69, plus secret /
state / schema suites).

---

## 1. Defects corrected
The first real project exposed structural gaps; each is now closed:

| # | Defect | Fix |
|---|--------|-----|
| 1 | User had to manually run `/plan_audit` | Independent audit + auto-repair + re-audit is **embedded** in `/plan_max` (closed loop). |
| 2 | A second hardening prompt was needed to fix contracts/gates | Gate-phase separation + strengthened validator now enforce this automatically. |
| 3 | Frontend planning was shallow | Dedicated frontend reference intake, frontend grill, and per-surface screen/component/interaction/state contracts. |
| 4 | Product / backend / frontend logic not reconciled | Mandatory `vertical-traceability.yaml` across every applicable layer. |
| 5 | AI's role not challenged deeply | Mandatory `product-logic-and-intelligence-grill` → `ai-responsibility-matrix.yaml`. |
| 6 | Workflow-first when the product was AI-first | Intelligence grill + AI-centrality evaluator reject fixed flows masquerading as AI. |
| 7 | Frontend lacked creativity/completeness/validation | Frontend experience grill + `frontend_experience_review_passed` gate + browser validator scope. |
| 8 | AI simulated instead of real integration | `real-ai-integration-plan` + `ai-provider-contract` + `real_ai_integration_verified` gate; mocks forbidden as production default. |
| 9 | "Production-ready" undefined | Strict definition in `policies/production-ready.md` + `production-readiness.yaml` + `production_like_run_verified` gate. |

## 2. Canonical files changed
- `contracts/completion-gates.yaml` — new gates + `gate_phase` classification.
- `lifecycle/state-machine.json` — planning states `INTELLIGENCE_GRILL`, `FRONTEND_GRILL`, `RECONCILING`, `REPAIRING_PLAN`; implementation state `PRODUCTION_VERIFICATION`; audit→repair loop.
- `core/os-manifest.yaml` — version 1.1.0, new principles, script registry.
- `policies/production-ready.md` (new), `policies/decision-resolution.md` (visual-question guidance).
- `evaluators/` — 5 new evaluators + 2 updated + README.
- `documentation/plan-package-layout.md` — new artifacts.
- Generators (source of truth): `scripts/gen_schemas.py`, `scripts/gen_templates.py`, `scripts/gen_registries.py`.
- `scripts/sync_runtime_adapters.py` now rebuilds schemas + templates + registries + adapters + validators in one command.

## 3. Agents changed (33 → 36)
- **New (implementation):** `frontend-experience-reviewer` (owns `frontend_experience_review_passed`), `production-verification-agent` (owns `production_like_run_verified`).
- **Updated:** `grill-master` (+ intelligence grill), `frontend-uiux-architect` (+ reference intake, frontend grill, screen + interaction contracts), `ai-orchestration-architect` (+ real integration), `plan-consistency-judge` (+ cross-layer / gate-state / fake-path checks), `planning-orchestrator` (+ reconciliation / deliverables / readiness), `frontend-uiux-builder`, `ai-orchestration-builder`, `browser-ui-validator`.

## 4. Skills changed (78 → 101, +23)
- **Planning (+9):** `product-logic-and-intelligence-grill`, `frontend-reference-intake`, `frontend-experience-grill`, `frontend-screen-contract-planning`, `frontend-backend-contract-planning`, `real-ai-integration-planning`, `cross-layer-reconciliation`, `implementation-deliverables-planning`, `production-readiness-planning`.
- **Implementation (+14):** `frontend-product-translation`, `frontend-design-system`, `creative-ui-concept`, `information-hierarchy`, `animation-and-microinteraction`, `frontend-state-completeness`, `loading-error-empty-states`, `frontend-backend-contract`, `ai-interface-implementation`, `design-reference-compliance`, `visual-regression`, `frontend-performance`, `frontend-experience-review`, `production-like-run-verification`.
- `plan-max-orchestration` procedure rewritten to the closed loop (intelligence grill → frontend grill → contracts → real AI → reconciliation → deliverables/readiness → embedded audit + repair loop).

## 5. Templates and schemas added
- **Schemas (+14):** `frontend-reference`, `design-token`, `frontend-state`, `screen-contract`, `component-contract`, `interaction-contract`, `visual-quality-review`, `ai-responsibility-matrix`, `ai-provider-contract`, `real-ai-integration-plan`, `vertical-traceability`, `implementation-deliverable`, `production-readiness`, `production-like-run`.
- **Templates (+14):** `34-frontend-reference-intake` … `47-production-like-run`.

## 6. /plan_max behavior — before vs after
**Before:** idea → grill → questions → domain plans → task decomposition → package →
`plan-consistency-validation`. Stopped after producing files. Frontend was a list of
screens; AI could be scripted; the user then ran `/plan_audit` and a hardening prompt.

**After (closed loop):** idea → grill → **product-logic & intelligence grill** →
questions → product plan → domain plans → **frontend reference intake → frontend grill
→ screen/component/interaction/state contracts** → **real AI integration plan** (when
central) → **cross-layer reconciliation** (`vertical-traceability.yaml`) → vertical-slice
task decomposition → **deliverables + production-readiness contracts** → package with
implementation gates **PENDING** → **embedded independent audit → auto-repair → re-audit
loop** → `IMPLEMENTATION_READY`. No second command required. `/plan_audit` is optional;
`/plan_frontend_max`, `/plan_backend_max`, `/plan_ai_max`, `/plan_data_max`,
`/plan_reconcile` are refinement-only.

## 7. Frontend reference behavior
- Factory templates live in `system-building-os/templates/project-reference/frontend/`.
- `scripts/install_project_reference.py` scaffolds `project-reference/frontend/`
  (`FRONTEND_REFERENCE.md`, `design-tokens.yaml`, `screen-inventory.yaml`, `assets/`,
  `inspiration/`) into a **product** repo. Re-runs **never overwrite** user files;
  `--force` only refreshes project-owned scaffolding. Files are classified
  `user-customizable` / `project-owned` / `protected-from-regeneration` (verified by test).
- `/plan_max` inspects the package before frontend planning; when absent it infers a
  direction, proposes a reference file, and asks only grouped material visual questions.
  Every visual decision records provenance (user / references / inference).

## 8. Real AI integration enforcement
- When `has_ai`, the validator **requires** `ai-responsibility-matrix.yaml`,
  `ai/ai-provider-contract.yaml`, `ai/real-ai-integration-plan.yaml`, and the presence
  of centrality tests. Provider-independent interface **and** a concrete adapter are
  required; env vars are named only (`OPENAI_API_KEY`, `OPENAI_MODEL`); mocks are test
  doubles / offline-dev / CI / demo only — never the production default. Gate:
  `real_ai_integration_verified`. The AI-centrality evaluator rejects fixed-sequence /
  scripted production paths.

## 9. New completion gates
- **Planning (may be PASS at end of planning):** `planning_package_complete`,
  `independent_plan_audit_passed`, `codex_handoff_valid` (plus existing `active_plan_valid`).
- **Implementation (begin PENDING; PASS only with Codex evidence):** `frontend_implemented`,
  `backend_implemented`, `database_implemented`, `authentication_implemented`,
  `real_ai_integration_verified`, `frontend_experience_review_passed`,
  `production_like_run_verified`.
- `contracts/completion-gates.yaml` adds a `gate_phase` map; `validate_plan_package.py`
  fails if any implementation gate is marked PASS in a freshly-planned package.

## 10. Tests and evidence
- New suite `tests/unit/test_production_complete.py` (**69 checks**): gate-phase
  separation; validator refusal of missing real-AI plan, missing screen contracts,
  incomplete vertical traceability, and PASSed implementation gates; presence of every
  new schema/template/command/evaluator/skill/agent; closed-loop procedure; and
  section-23 scenario detection.
- New idea fixtures: `ai-first-interview`, `full-stack-saas`, `chatbot`,
  `backend-without-frontend`, `frontend-static-mocks` (visual app already covered by
  `visual-frontend`). `analyze_idea.py` now detects AI-centrality, missing frontend,
  and fake-data paths.
- Both example plan packages (`internal-crud`, `ai-saas`) were enriched to be
  production-complete and now validate at 127/127 against the stricter validator.
- `sync_runtime_adapters.py` + `run_all.py` extended; all suites green.

## 11. Compatibility limitations
- The deterministic validator/analyzer subset reflects factory mechanics; the
  semantic depth of the grills, reconciliation, and audit-repair loop is executed by
  Claude at runtime (as designed). `jsonschema_lite` remains a strict-but-partial
  JSON-Schema subset.
- Plan-facts are read from `PLAN_METADATA.yaml` (`has_ui`/`has_ai`/`has_database`/
  `has_auth`) with inference from `EXECUTION.lock` gates as a fallback; a plan that
  declares neither will under-enforce optional layers.
- Generators add but do not delete stale adapter files; none were removed in this
  update, so no cleanup was required.

## 12. Migration steps for existing installed projects
1. Pull this OS update and run `python3 scripts/sync_runtime_adapters.py` (rebuilds
   schemas, templates, registries, and all adapters) then `python3 tests/run_all.py`.
2. In each **product** repo, run `python3 scripts/install_project_reference.py <repo>`
   to add `project-reference/frontend/` (safe on existing repos — never overwrites).
3. For any **active** plan, add the now-required artifacts (`vertical-traceability.yaml`,
   `implementation-deliverables.yaml`, `production-readiness.yaml`, and — per facts —
   `frontend/` and `ai/` contracts), set the `has_*` facts in `PLAN_METADATA.yaml`,
   ensure implementation gates are `PENDING`, then re-run
   `python3 scripts/validate_plan_package.py plans/active/<slug>` (or `/plan_reconcile`).
4. New plans need no migration: `/plan_max` produces the full production-complete
   package and audits it end to end.
