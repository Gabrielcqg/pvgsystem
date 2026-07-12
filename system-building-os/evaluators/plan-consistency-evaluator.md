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
