#!/usr/bin/env python3
"""Validate a plan package for structural completeness, schema conformance, and
traceability closure. Used by /prepare_codex, /plan_validate, and the factory
dry-run tests.

Usage: python3 scripts/validate_plan_package.py <plan-dir> [--quiet]

A plan is NOT implementation-ready merely because files exist: this checks
content (schemas + cross-references + no critical TBD).
"""
from __future__ import annotations

import glob
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "lib"))
import jsonschema_lite  # noqa: E402
import osutil  # noqa: E402
import evaluate_completion_gates as gates_mod  # noqa: E402

REQUIRED_FILES = [
    "PLAN_METADATA.yaml", "EXECUTION.lock",
    "01-user-intent.json", "05-product-system-plan.md",
    "18-task-manifest.yaml", "20-agent-map.yaml", "21-skill-map.yaml",
    "22-file-ownership.yaml", "26-acceptance-criteria.yaml",
    "27-requirement-traceability.yaml", "28-codex-handoff.md", "29-codex-start.md",
    # production-complete package: cross-layer + deliverables + readiness
    "vertical-traceability.yaml", "implementation-deliverables.yaml",
    "production-readiness.yaml",
]
SCHEMA_ARTIFACTS = {
    "PLAN_METADATA.yaml": "plan-metadata",
    "01-user-intent.json": "user-intent",
    "18-task-manifest.yaml": "task-manifest",
    "20-agent-map.yaml": "agent-map",
    "21-skill-map.yaml": "skill-map",
    "22-file-ownership.yaml": "file-ownership",
    "26-acceptance-criteria.yaml": "acceptance-criteria",
    "27-requirement-traceability.yaml": "traceability",
    "vertical-traceability.yaml": "vertical-traceability",
    "implementation-deliverables.yaml": "implementation-deliverable",
    "production-readiness.yaml": "production-readiness",
    # conditional artifacts (validated when present)
    "ai-responsibility-matrix.yaml": "ai-responsibility-matrix",
    "ai/ai-provider-contract.yaml": "ai-provider-contract",
    "ai/real-ai-integration-plan.yaml": "real-ai-integration-plan",
    "frontend/frontend-reference.yaml": "frontend-reference",
    "frontend/design-tokens.yaml": "design-token",
    "frontend/interaction-contracts.yaml": "interaction-contract",
}
CRITICAL_TBD_FILES = ["05-product-system-plan.md", "28-codex-handoff.md", "29-codex-start.md"]


def derive_facts(meta: dict, lock: dict) -> dict:
    """Determine which product layers apply. Explicit PLAN_METADATA facts win;
    otherwise infer from EXECUTION.lock completion gates."""
    meta = meta or {}
    gates = set((lock or {}).get("required_completion_gates", []) or [])

    def fact(key, gate_signals):
        if key in meta:
            return bool(meta[key])
        return bool(gates & set(gate_signals))

    return {
        "has_ui": fact("has_ui", ["e2e_tests_passed", "browser_validation_passed",
                                  "frontend_implemented", "frontend_experience_review_passed"]),
        "has_ai": fact("has_ai", ["ai_evaluations_passed", "real_ai_integration_verified"]),
        "has_database": fact("has_database", ["database_tests_passed",
                                              "migration_validation_passed", "database_implemented"]),
        "has_auth": fact("has_auth", ["auth_tests_passed", "authorization_tests_passed",
                                      "authentication_implemented"]),
    }


def load_schema(name: str) -> dict:
    return osutil.load_json(f"system-building-os/schemas/{name}.schema.json")


def validate(plan_dir: str, quiet: bool = False) -> int:
    r = osutil.Reporter(f"plan-package:{os.path.basename(plan_dir.rstrip('/'))}")

    def p(f):
        return os.path.join(plan_dir, f)

    for f in REQUIRED_FILES:
        r.check(os.path.exists(p(f)), f"required file present: {f}")

    artifacts = {}
    for f, schema_name in SCHEMA_ARTIFACTS.items():
        if not os.path.exists(p(f)):
            continue
        try:
            data = osutil.load_any(p(f))
            artifacts[f] = data
            errs = jsonschema_lite.validate(data, load_schema(schema_name))
            r.check(not errs, f"{f} validates against {schema_name}"
                    + ("" if not errs else f" — {errs[:2]}"))
        except Exception as exc:  # noqa: BLE001
            r.fail(f"{f}: load/validate error: {exc}")

    # Cross-reference: every task.assigned_agent exists in the agent map
    tm = artifacts.get("18-task-manifest.yaml")
    am = artifacts.get("20-agent-map.yaml")
    if tm and am:
        agent_ids = {a["id"] for a in am.get("agents", [])}
        for t in tm.get("tasks", []):
            r.check(t.get("assigned_agent") in agent_ids,
                    f"task {t.get('id')}: assigned_agent '{t.get('assigned_agent')}' in agent map")

    # Cross-reference: every task acceptance criterion exists in acceptance file
    ac = artifacts.get("26-acceptance-criteria.yaml")
    if tm and ac:
        ac_ids = {c["id"] for c in ac.get("criteria", [])}
        for t in tm.get("tasks", []):
            for acid in t.get("acceptance_criteria", []):
                r.check(acid in ac_ids, f"task {t.get('id')}: AC '{acid}' defined")

    # Traceability closure: every requirement->task and acceptance->test present
    tr = artifacts.get("27-requirement-traceability.yaml")
    if tr:
        r.check(bool(tr.get("requirement_to_task")), "traceability: requirement_to_task present")
        r.check(bool(tr.get("acceptance_to_test")), "traceability: acceptance_to_test present")
        # every acceptance criterion must map to at least one test
        if ac:
            a2t = tr.get("acceptance_to_test", {})
            for c in ac.get("criteria", []):
                mapped = a2t.get(c["id"])
                r.check(bool(mapped), f"acceptance {c['id']} maps to a test")

    # Dependencies form a DAG (no cycle) and reference real tasks
    if tm:
        ids = {t["id"] for t in tm.get("tasks", [])}
        deps = {t["id"]: [d for d in t.get("dependencies", [])] for t in tm.get("tasks", [])}
        for tid, ds in deps.items():
            for d in ds:
                r.check(d in ids, f"task {tid}: dependency '{d}' exists")
        r.check(_is_dag(deps), "task dependency graph is acyclic (DAG)")

    # No critical TBD/TODO in key documents
    for f in CRITICAL_TBD_FILES:
        if os.path.exists(p(f)):
            text = osutil.read_text(p(f)).upper()
            has = ("TBD" in text) or ("TODO" in text) or ("FIXME" in text)
            r.check(not has, f"{f}: no critical TBD/TODO/FIXME marker")

    # EXECUTION.lock sanity
    lock = None
    if os.path.exists(p("EXECUTION.lock")):
        lock = osutil.load_yaml(p("EXECUTION.lock"))
        r.check(lock.get("execution_mode") == "autonomous", "EXECUTION.lock: autonomous mode")
        r.check(bool(lock.get("required_completion_gates")), "EXECUTION.lock: completion gates listed")

    # ---- production-complete checks ----
    meta = artifacts.get("PLAN_METADATA.yaml") or {}
    facts = derive_facts(meta, lock or {})

    # Validate any glob'd screen contracts against the screen-contract schema
    screen_files = sorted(glob.glob(os.path.join(plan_dir, "frontend", "screen-contracts", "*.yaml")))
    for sf in screen_files:
        try:
            data = osutil.load_any(sf)
            errs = jsonschema_lite.validate(data, load_schema("screen-contract"))
            r.check(not errs, f"{os.path.relpath(sf, plan_dir)} validates against screen-contract"
                    + ("" if not errs else f" — {errs[:2]}"))
        except Exception as exc:  # noqa: BLE001
            r.fail(f"{sf}: load/validate error: {exc}")

    # Gate-state separation: implementation gates must NOT be PASS in a planned package.
    impl_gates = gates_mod.implementation_gates()
    gate_states = {}
    gate_states.update((meta.get("gates") or {}))
    if lock:
        gate_states.update((lock.get("gate_status") or {}))
    if os.path.exists(p("gate-status.yaml")):
        gate_states.update(osutil.load_yaml(p("gate-status.yaml")) or {})
    for g, state in gate_states.items():
        if g in impl_gates:
            r.check(str(state).upper() != "PASS",
                    f"gate-state separation: implementation gate '{g}' is not PASS before implementation "
                    f"(is {state})")

    # Production-readiness: every applicable layer must be planned + gated.
    pr = artifacts.get("production-readiness.yaml")
    layer_state = {}
    if pr:
        for lyr in pr.get("layers", []):
            layer_state[lyr.get("layer")] = lyr
            if lyr.get("applicable"):
                r.check(bool(lyr.get("planned")),
                        f"production-readiness: applicable layer '{lyr.get('layer')}' is planned")
                r.check(bool(lyr.get("implementation_gate")),
                        f"production-readiness: layer '{lyr.get('layer')}' is bound to a gate")

    def layer_applicable(name: str) -> bool:
        return bool(layer_state.get(name, {}).get("applicable"))

    # Facts must agree with the readiness matrix for the load-bearing layers.
    if pr:
        if facts["has_ui"]:
            r.check(layer_applicable("frontend"),
                    "production-readiness: frontend layer applicable when the product has a UI")
        if facts["has_ai"]:
            r.check(layer_applicable("ai_behavior"),
                    "production-readiness: ai_behavior layer applicable when AI is central")
        if facts["has_database"]:
            r.check(layer_applicable("database"),
                    "production-readiness: database layer applicable when there is persistence")
        if facts["has_auth"]:
            r.check(layer_applicable("authentication"),
                    "production-readiness: authentication layer applicable when access is private/role-based")

    # Conditional artifact presence for load-bearing layers.
    if facts["has_ui"]:
        r.check(os.path.exists(p("frontend/frontend-reference.yaml")),
                "has_ui: frontend/frontend-reference.yaml present (reference intake)")
        r.check(bool(screen_files),
                "has_ui: at least one frontend/screen-contracts/*.yaml present")
    if facts["has_ai"]:
        for f in ("ai-responsibility-matrix.yaml", "ai/ai-provider-contract.yaml",
                  "ai/real-ai-integration-plan.yaml"):
            r.check(os.path.exists(p(f)), f"has_ai: {f} present (real AI integration required)")
        rai = artifacts.get("ai/real-ai-integration-plan.yaml")
        if rai:
            r.check(bool(rai.get("centrality_tests")),
                    "real AI integration plan lists centrality tests")

    # Vertical-traceability closure across applicable layers.
    vt = artifacts.get("vertical-traceability.yaml")
    if vt:
        rows = vt.get("requirements", [])
        ac_ids = set()
        if ac:
            ac_ids = {c["id"] for c in ac.get("criteria", [])}
        vt_reqs = set()
        for row in rows:
            rid = row.get("requirement_id")
            vt_reqs.add(rid)
            r.check(bool(row.get("acceptance_criteria")),
                    f"vertical-traceability {rid}: has acceptance criteria")
            r.check(bool(row.get("tests")), f"vertical-traceability {rid}: has tests")
            for acid in row.get("acceptance_criteria", []):
                if ac_ids:
                    r.check(acid in ac_ids,
                            f"vertical-traceability {rid}: AC '{acid}' exists")
        # every requirement that maps to a task must also be vertically reconciled
        if tr:
            for rid in (tr.get("requirement_to_task") or {}):
                r.check(rid in vt_reqs,
                        f"vertical-traceability: requirement '{rid}' is reconciled across layers")
        # applicable layers must appear somewhere in the reconciliation
        if facts["has_ui"]:
            r.check(any(row.get("frontend_surfaces") for row in rows),
                    "vertical-traceability: UI requirements map to frontend surfaces")
            r.check(any(row.get("frontend_states") for row in rows),
                    "vertical-traceability: UI requirements map to frontend states")
        if facts["has_ai"]:
            r.check(any(row.get("ai_behaviors") for row in rows),
                    "vertical-traceability: AI requirements map to AI behaviors")
        if facts["has_database"]:
            r.check(any(row.get("database_entities") for row in rows),
                    "vertical-traceability: persisted requirements map to database entities")

    # Deliverables must exist for each applicable load-bearing layer.
    deliv = artifacts.get("implementation-deliverables.yaml")
    if deliv:
        dtypes = {d.get("type") for d in deliv.get("deliverables", [])}
        if facts["has_ui"]:
            r.check("frontend" in dtypes, "deliverables: a frontend deliverable exists")
        if facts["has_ai"]:
            r.check("ai_integration" in dtypes, "deliverables: an ai_integration deliverable exists")
        if facts["has_database"]:
            r.check("database" in dtypes, "deliverables: a database deliverable exists")
        if facts["has_auth"]:
            r.check("authentication" in dtypes, "deliverables: an authentication deliverable exists")

    return r.finish(quiet=quiet)


def _is_dag(deps: dict) -> bool:
    color = {}

    def visit(n):
        color[n] = 1
        for m in deps.get(n, []):
            if color.get(m) == 1:
                return False
            if color.get(m, 0) == 0 and not visit(m):
                return False
        color[n] = 2
        return True

    return all(visit(n) for n in deps if color.get(n, 0) == 0)


def main(argv: list[str]) -> int:
    if not argv:
        print(__doc__)
        return 2
    quiet = "--quiet" in argv
    dirs = [a for a in argv if not a.startswith("--")]
    rc = 0
    for d in dirs:
        d = d if os.path.isabs(d) else osutil.rel(d)
        if not os.path.isdir(d):
            # allow globs
            for g in glob.glob(d):
                rc |= validate(g, quiet)
            continue
        rc |= validate(d, quiet)
    return rc


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
