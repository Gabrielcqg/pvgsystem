#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "lib"))
import osutil  # noqa: E402

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from evaluate_completion_gates import evaluate  # noqa: E402


PLAN_ROOT = Path("plans/active/pavageau-sistema-integrado-backend")
EVIDENCE_ROOT = Path("docs/evidence")
EXPECTED_SLUG = "pavageau-sistema-integrado-backend"
EXPECTED_VERSION = "2.5.1"
EXPECTED_HASH = "sha256:9f9fe612f27977042e46edf34a7ce4daae5eb0f11b0f0aa501268f08514ba36c"


def _load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def judge() -> tuple[bool, dict[str, Any]]:
    metadata = osutil.load_yaml(str(PLAN_ROOT / "PLAN_METADATA.yaml"))
    lock = osutil.load_yaml(str(PLAN_ROOT / "EXECUTION.lock"))
    trace = osutil.load_yaml(str(PLAN_ROOT / "27-requirement-traceability.yaml"))
    criteria = osutil.load_yaml(str(PLAN_ROOT / "26-acceptance-criteria.yaml"))["criteria"]
    facts = _load_json(EVIDENCE_ROOT / "completion-gate-facts.json")
    results = _load_json(EVIDENCE_ROOT / "completion-gate-results.json")

    errors: list[str] = []
    warnings: list[str] = []
    if metadata.get("project_slug") != EXPECTED_SLUG:
        errors.append(f"unexpected slug: {metadata.get('project_slug')}")
    if str(metadata.get("version")) != EXPECTED_VERSION:
        errors.append(f"unexpected version: {metadata.get('version')}")
    if metadata.get("content_hash") != EXPECTED_HASH or lock.get("active_plan_hash") != EXPECTED_HASH:
        errors.append("metadata/lock hash mismatch")
    plan_hash_evidence_path = EVIDENCE_ROOT / "plan-hash-validation.json"
    if not plan_hash_evidence_path.exists():
        errors.append("plan hash validation evidence missing")
    else:
        plan_hash_evidence = _load_json(plan_hash_evidence_path)
        if plan_hash_evidence.get("metadata_hash") != EXPECTED_HASH or plan_hash_evidence.get("lock_hash") != EXPECTED_HASH:
            errors.append("plan hash evidence does not match expected metadata/lock hash")
        if plan_hash_evidence.get("canonical_algorithm_available"):
            if plan_hash_evidence.get("recomputed_hash") != EXPECTED_HASH:
                errors.append("recomputed canonical plan package hash mismatch")
        else:
            warnings.append("canonical plan package byte-hash algorithm is absent; validated metadata/lock hash equality and recorded attempted manifest digests")
    if lock.get("plan_status") != "implementation_ready":
        errors.append(f"unexpected plan status: {lock.get('plan_status')}")
    if lock.get("closure_pass", {}).get("codex_questions_required") != 0:
        errors.append("codex questions remain required")

    requirement_to_task = trace["requirement_to_task"]
    requirement_to_acceptance = trace["requirement_to_acceptance"]
    acceptance_to_test = trace["acceptance_to_test"]
    requirements = sorted(requirement_to_task)
    acceptance_ids = sorted(item["id"] for item in criteria)
    if len(requirements) != lock.get("closure_pass", {}).get("requirements_total"):
        errors.append("requirement count does not match EXECUTION.lock")
    if len(criteria) != 80:
        errors.append(f"acceptance criteria count is {len(criteria)}, expected 80")
    missing_task = [req for req in requirements if not requirement_to_task.get(req)]
    missing_acceptance = [req for req in requirements if not requirement_to_acceptance.get(req)]
    missing_test = [ac for ac in acceptance_ids if not acceptance_to_test.get(ac)]
    if missing_task:
        errors.append(f"requirements without tasks: {missing_task}")
    if missing_acceptance:
        errors.append(f"requirements without acceptance criteria: {missing_acceptance}")
    if missing_test:
        errors.append(f"acceptance criteria without tests: {missing_test}")

    gates_ok, gate_rows = evaluate(facts, results)
    if not gates_ok:
        errors.append("one or more required completion gates are not PASS")

    acceptance_evidence = _load_json(EVIDENCE_ROOT / "acceptance-evidence.json")
    if acceptance_evidence.get("acceptance_criteria_evaluated") != len(criteria):
        errors.append("acceptance evidence does not evaluate every criterion")
    if acceptance_evidence.get("requirements_with_evidence") != len(requirements):
        errors.append("requirement evidence does not cover every requirement")
    if acceptance_evidence.get("requirements_total") != len(requirements):
        errors.append("requirement evidence total mismatch")
    if not acceptance_evidence.get("all_acceptance_criteria_passed"):
        errors.append("acceptance evidence has failing criteria")

    report = {
        "ok": not errors,
        "errors": errors,
        "warnings": warnings,
        "plan": {
            "slug": metadata.get("project_slug"),
            "version": str(metadata.get("version")),
            "hash": metadata.get("content_hash"),
        },
        "counts": {
            "requirements": len(requirements),
            "acceptance_criteria": len(criteria),
            "completion_gates": len(gate_rows),
        },
        "gates": [{"gate": gate, "state": state, "note": note} for gate, state, note in gate_rows],
    }
    return not errors, report


def main() -> int:
    parser = argparse.ArgumentParser(description="Independent final acceptance judge for the active implementation.")
    parser.add_argument("--write", default="docs/evidence/final-acceptance-judge.json")
    args = parser.parse_args()
    ok, report = judge()
    out = Path(args.write)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(report, indent=2, ensure_ascii=False))
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
