#!/usr/bin/env python3
"""Evaluate completion gates for a plan, given plan facts and gate results.

This is the deterministic logic Codex's final-acceptance-judge uses to decide
whether implementation may complete. It resolves conditional gates
(required_when_*) against plan facts and refuses completion unless every
applicable required gate is PASS.

Usage:
  python3 scripts/evaluate_completion_gates.py <facts.json> <results.json>

facts.json:   {"has_database": true, "has_auth": true, "has_ui": true, "has_ai": false,
               "lint_configured": true, "types_applicable": true, ...}
results.json: {"build_passed": "PASS", "unit_tests_passed": "PASS", ...}  (PASS|FAIL|NA|PENDING)

Also importable: evaluate(facts, results) -> (ok: bool, rows: list).
"""
from __future__ import annotations

import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "lib"))
import osutil  # noqa: E402

COND = {
    "lint_passed": ("required_when_configured", "lint_configured"),
    "typecheck_passed": ("required_when_applicable", "types_applicable"),
    "integration_tests_passed": ("required_when_applicable", "has_integration"),
    "contract_tests_passed": ("required_when_applicable", "has_integration"),
    "frontend_implemented": ("required_when_ui_exists", "has_ui"),
    "database_implemented": ("required_when_database_exists", "has_database"),
    "authentication_implemented": ("required_when_auth_exists", "has_auth"),
    "real_ai_integration_verified": ("required_when_ai_exists", "has_ai"),
    "database_tests_passed": ("required_when_database_exists", "has_database"),
    "migration_validation_passed": ("required_when_database_exists", "has_database"),
    "auth_tests_passed": ("required_when_auth_exists", "has_auth"),
    "authorization_tests_passed": ("required_when_auth_exists", "has_auth"),
    "e2e_tests_passed": ("required_when_ui_exists", "has_ui"),
    "browser_validation_passed": ("required_when_ui_exists", "has_ui"),
    "accessibility_validation_passed": ("required_when_ui_exists", "has_ui"),
    "frontend_experience_review_passed": ("required_when_ui_exists", "has_ui"),
    "ai_evaluations_passed": ("required_when_ai_exists", "has_ai"),
    "observability_verified": ("required_when_applicable", "has_observability"),
}


def _load_contract() -> dict:
    return osutil.load_yaml("system-building-os/contracts/completion-gates.yaml")


def load_gates() -> dict:
    return _load_contract()["completion_gates"]


def gate_phase() -> dict:
    """Return {"planning": [...], "implementation": [...]} gate classification."""
    return _load_contract().get("gate_phase", {"planning": [], "implementation": []})


def planning_gates() -> set:
    return set(gate_phase().get("planning", []))


def implementation_gates() -> set:
    return set(gate_phase().get("implementation", []))


def evaluate(facts: dict, results: dict):
    gates = load_gates()
    rows = []
    ok = True
    for gate, spec in gates.items():
        result = results.get(gate, "PENDING")
        applicable = True
        if gate in COND:
            _, fact_key = COND[gate]
            applicable = bool(facts.get(fact_key, False))
        if not applicable:
            rows.append((gate, "NA", "not applicable"))
            continue
        if result == "PASS":
            rows.append((gate, "PASS", ""))
        elif result == "NA" and spec != "required":
            rows.append((gate, "NA", "declared N/A for conditional gate"))
        else:
            ok = False
            rows.append((gate, result, "REQUIRED gate not passing"))
    return ok, rows


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print(__doc__)
        return 2
    facts = json.loads(osutil.read_text(argv[0]) if os.path.exists(osutil.rel(argv[0])) else argv[0])
    results = json.loads(osutil.read_text(argv[1]) if os.path.exists(osutil.rel(argv[1])) else argv[1])
    ok, rows = evaluate(facts, results)
    for gate, state, note in rows:
        print(f"  {state:5} {gate}  {note}".rstrip())
    print("COMPLETION: PASS" if ok else "COMPLETION: BLOCKED — reopen failing/pending required gates")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
