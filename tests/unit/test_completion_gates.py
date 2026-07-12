#!/usr/bin/env python3
"""Completion-gate logic tests: a required gate that is FAIL/PENDING blocks
completion; conditional gates are N/A when the plan fact is absent; all-pass
completes; a project cannot 'complete' with failing tests."""
from __future__ import annotations

import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(ROOT, "scripts"))
sys.path.insert(0, os.path.join(ROOT, "scripts", "lib"))
import evaluate_completion_gates as gates  # noqa: E402
import osutil  # noqa: E402

FULL_FACTS = {"has_database": True, "has_auth": True, "has_ui": True, "has_ai": True,
              "has_integration": True, "has_observability": True,
              "lint_configured": True, "types_applicable": True}


def all_pass_results() -> dict:
    gd = gates.load_gates()
    return {g: "PASS" for g in gd}


def main() -> int:
    r = osutil.Reporter("completion-gates")

    # 1. All gates PASS with full facts -> completes
    ok, _ = gates.evaluate(FULL_FACTS, all_pass_results())
    r.check(ok, "all gates PASS -> completion allowed")

    # 2. A required gate FAIL blocks completion
    res = all_pass_results()
    res["unit_tests_passed"] = "FAIL"
    ok, _ = gates.evaluate(FULL_FACTS, res)
    r.check(not ok, "failing unit tests block completion")

    # 3. A required gate PENDING blocks completion
    res = all_pass_results()
    res["security_review_passed"] = "PENDING"
    ok, _ = gates.evaluate(FULL_FACTS, res)
    r.check(not ok, "pending required gate blocks completion")

    # 4. Conditional gate is N/A when the fact is absent (no DB)
    facts = dict(FULL_FACTS, has_database=False)
    res = all_pass_results()
    res["database_tests_passed"] = "PENDING"  # would fail if required
    res["migration_validation_passed"] = "PENDING"
    ok, rows = gates.evaluate(facts, res)
    r.check(ok, "no-database plan: database gates are N/A, completion allowed")
    na_gates = {g for g, s, _ in rows if s == "NA"}
    r.check("database_tests_passed" in na_gates, "database_tests_passed marked N/A without a DB")

    # 5. UI gates required when UI exists
    facts = dict(FULL_FACTS, has_ui=True)
    res = all_pass_results()
    res["e2e_tests_passed"] = "FAIL"
    ok, _ = gates.evaluate(facts, res)
    r.check(not ok, "UI plan with failing e2e blocks completion")

    # 6. AI eval gate N/A when no AI
    facts = dict(FULL_FACTS, has_ai=False)
    res = all_pass_results()
    res["ai_evaluations_passed"] = "FAIL"
    ok, _ = gates.evaluate(facts, res)
    r.check(ok, "no-AI plan: ai_evaluations gate is N/A")

    # 7. final_acceptance_judge is always required
    res = all_pass_results()
    res["final_acceptance_judge_passed"] = "FAIL"
    ok, _ = gates.evaluate(FULL_FACTS, res)
    r.check(not ok, "final acceptance judge failing blocks completion")

    return r.finish(quiet=True)


if __name__ == "__main__":
    raise SystemExit(main())
