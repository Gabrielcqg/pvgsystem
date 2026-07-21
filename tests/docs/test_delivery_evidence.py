from __future__ import annotations

import json
from pathlib import Path

import pytest


EVIDENCE = Path("docs/evidence")
FINAL_REPORT = Path("plans/active/pavageau-sistema-integrado-backend/runtime/final-implementation-report.json")


@pytest.mark.docs
def test_doc_01_evidence_index_deviation_report_and_final_report_present() -> None:
    required = [
        EVIDENCE / "README.md",
        EVIDENCE / "acceptance-evidence.json",
        EVIDENCE / "plan-hash-validation.json",
        EVIDENCE / "deviations.json",
        EVIDENCE / "external-blockers.json",
        EVIDENCE / "EVID-01-local-production-like-run.json",
        EVIDENCE / "final-acceptance-judge.json",
        FINAL_REPORT,
    ]
    missing = [str(path) for path in required if not path.exists()]
    assert not missing

    final_report = json.loads(FINAL_REPORT.read_text(encoding="utf-8"))
    assert final_report["truthful"] is True
    assert final_report["final_acceptance_judge_passed"] is True
    plan_hash = json.loads((EVIDENCE / "plan-hash-validation.json").read_text(encoding="utf-8"))
    assert plan_hash["metadata_hash"] == plan_hash["expected_hash"]
    assert plan_hash["lock_hash"] == plan_hash["expected_hash"]


@pytest.mark.docs
def test_final_acceptance_judge_output_covers_requirements_and_criteria() -> None:
    judge = json.loads((EVIDENCE / "final-acceptance-judge.json").read_text(encoding="utf-8"))
    acceptance = json.loads((EVIDENCE / "acceptance-evidence.json").read_text(encoding="utf-8"))

    assert judge["ok"] is True
    assert judge["counts"]["requirements"] == 66
    assert acceptance["acceptance_criteria_evaluated"] == 80
    assert acceptance["requirements_with_evidence"] == 66
