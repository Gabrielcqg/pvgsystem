#!/usr/bin/env python3
"""Dry-run factory tests: for each idea fixture, the planning preflight must
activate planning skills, run the grill, detect the expected missing decisions,
ask only material questions, and NOT produce product code. Example plan packages
must validate and contain no product source code."""
from __future__ import annotations

import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(ROOT, "scripts"))
sys.path.insert(0, os.path.join(ROOT, "scripts", "lib"))
import analyze_idea  # noqa: E402
import osutil  # noqa: E402
import validate_plan_package  # noqa: E402

IDEAS = "tests/fixtures/ideas"
PKGS = "tests/fixtures/plan-packages"
PRODUCT_CODE_EXT = {".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rb", ".java",
                    ".rs", ".c", ".cpp", ".php", ".sql"}
PLAN_EXT = {".md", ".yaml", ".yml", ".json", ".lock"}


def main() -> int:
    r = osutil.Reporter("dry-run")

    for fn in sorted(os.listdir(osutil.rel(IDEAS))):
        fx = osutil.load_json(f"{IDEAS}/{fn}")
        res = analyze_idea.analyze(fx["signals"], fx["ambiguities"])
        slug = fx["slug"]
        r.check(res["grill_runs"], f"{slug}: grill process runs")
        r.check("grill-me-planning" in res["planning_skills_activated"],
                f"{slug}: grill-me-planning skill activated")
        r.check(len(res["planning_skills_activated"]) >= 20,
                f"{slug}: activates a full planning skill set ({len(res['planning_skills_activated'])})")
        r.check(set(res["detected_missing_decisions"]) == set(fx["expect"]),
                f"{slug}: detects expected missing decisions "
                f"(got {res['detected_missing_decisions']})")
        r.check(res["asks_material_question"] == fx["expect_material_question"],
                f"{slug}: asks material question == {fx['expect_material_question']}")
        r.check(res["produces_product_code"] is False,
                f"{slug}: does NOT implement product code")
        r.check(res["generates_task_manifest"] and res["generates_traceability"]
                and res["generates_codex_agents_and_skills"],
                f"{slug}: generates task manifest + traceability + codex agents/skills")

    # Dimension-specific detection sanity
    ai = osutil.load_json(f"{IDEAS}/ai-saas.json")
    ai_res = analyze_idea.analyze(ai["signals"], ai["ambiguities"])
    r.check("ai_output_validation" in ai_res["detected_missing_decisions"],
            "ai-saas: detects missing AI output validation")
    r.check("ai-flow-planning" in ai_res["planning_skills_activated"],
            "ai-saas: activates ai-flow-planning")
    dp = osutil.load_json(f"{IDEAS}/data-pipeline.json")
    dp_res = analyze_idea.analyze(dp["signals"], dp["ambiguities"])
    r.check(not dp_res["asks_material_question"],
            "data-pipeline: asks no material question (nothing ambiguous)")

    # Example plan packages validate end-to-end and contain no product code
    for slug in sorted(os.listdir(osutil.rel(PKGS))):
        pkg = osutil.rel(f"{PKGS}/{slug}")
        if not os.path.isdir(pkg):
            continue
        rc = validate_plan_package.validate(pkg, quiet=True)
        r.check(rc == 0, f"plan package '{slug}' validates end-to-end")
        offending = []
        for dp2, _, files in os.walk(pkg):
            for f in files:
                ext = os.path.splitext(f)[1]
                if ext in PRODUCT_CODE_EXT:
                    offending.append(f)
        r.check(not offending, f"plan package '{slug}' contains no product source code")

    return r.finish(quiet=True)


if __name__ == "__main__":
    raise SystemExit(main())
