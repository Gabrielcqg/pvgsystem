# Plan Consistency Evaluator

Owned by the independent `plan-consistency-judge`. Checks (template 32): every
user objective represented; every requirement has an ID and acceptance criteria;
every AC has a test; task<->requirement mapping both directions; APIs/entities/
screens/roles/permissions/transitions/errors defined; integrations have
fallbacks; migrations/auth/security/perf/observability/rollback planned; MCP
access controlled; Codex agents/skills exist or will be generated; no unsafe
file-ownership conflicts; no critical TBD; handoff self-contained.

Deterministic structural subset: `scripts/validate_plan_package.py`. The judge
must ALSO assess content quality, not just file existence, and must not mark the
plan ready while any critical finding is open. Emits a validation score + findings.

## Production-complete checks (embedded in /plan_max)
The judge additionally verifies, inspecting **actual artifacts** (never the
synthesis report):
- omitted product logic; AI-vs-deterministic responsibility drift (see
  [ai-centrality-evaluator](ai-centrality-evaluator.md));
- frontend completeness — every UI surface has a screen contract, all states, and
  an interaction contract (see [frontend-experience-evaluator](frontend-experience-evaluator.md));
- backend / database / authentication completeness for applicable layers;
- cross-layer traceability closure (see [vertical-traceability-evaluator](vertical-traceability-evaluator.md));
- real AI integration requirements when AI is central;
- production readiness (see [production-readiness-evaluator](production-readiness-evaluator.md));
- test completeness and deliverable completeness;
- **implementation-gate state**: all implementation gates must be PENDING (never
  PASS) in a freshly-planned package;
- truncated artifacts, placeholder contracts, and fake production paths (see
  [fake-completion-evaluator](fake-completion-evaluator.md)).

The judge runs inside `/plan_max`: findings are classified critical/major/minor/
polish, critical + major are auto-repaired, and the judge re-runs until they clear.
Only then may `IMPLEMENTATION_READY` be set.
