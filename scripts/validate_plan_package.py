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

REQUIRED_FILES = [
    "PLAN_METADATA.yaml", "EXECUTION.lock",
    "01-user-intent.json", "05-product-system-plan.md",
    "18-task-manifest.yaml", "20-agent-map.yaml", "21-skill-map.yaml",
    "22-file-ownership.yaml", "26-acceptance-criteria.yaml",
    "27-requirement-traceability.yaml", "28-codex-handoff.md", "29-codex-start.md",
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
}
CRITICAL_TBD_FILES = ["05-product-system-plan.md", "28-codex-handoff.md", "29-codex-start.md"]


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
    if os.path.exists(p("EXECUTION.lock")):
        lock = osutil.load_yaml(p("EXECUTION.lock"))
        r.check(lock.get("execution_mode") == "autonomous", "EXECUTION.lock: autonomous mode")
        r.check(bool(lock.get("required_completion_gates")), "EXECUTION.lock: completion gates listed")

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
