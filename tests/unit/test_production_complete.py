#!/usr/bin/env python3
"""Production-complete update tests:
- gate-phase separation (planning vs implementation) and the validator's refusal
  to accept a PASSed implementation gate before implementation;
- the strengthened plan-package validator (real AI + frontend + vertical
  traceability required for applicable layers);
- presence of the new schemas, templates, commands, evaluators, agents, and skills;
- /plan_max is a closed loop (audit + repair embedded);
- detection of the section-23 failure scenarios (AI-centrality, missing frontend,
  fake data paths)."""
from __future__ import annotations

import contextlib
import io
import os
import shutil
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(ROOT, "scripts"))
sys.path.insert(0, os.path.join(ROOT, "scripts", "lib"))
import analyze_idea  # noqa: E402
import evaluate_completion_gates as gates_mod  # noqa: E402
import osutil  # noqa: E402
import validate_plan_package as vpp  # noqa: E402

FIXTURE = osutil.rel("tests/fixtures/plan-packages/ai-saas")


def _copy_fixture(tmp: str) -> str:
    dst = os.path.join(tmp, "pkg")
    shutil.copytree(FIXTURE, dst)
    return dst


def _validate_silent(pkg: str) -> int:
    """Validate while suppressing the (expected) per-check output of a mutated pkg."""
    with contextlib.redirect_stdout(io.StringIO()):
        return vpp.validate(pkg, quiet=True)


def main() -> int:
    r = osutil.Reporter("production-complete")

    # ---- gate-phase separation ----
    planning = gates_mod.planning_gates()
    impl = gates_mod.implementation_gates()
    r.check(planning == {"active_plan_valid", "planning_package_complete",
                         "independent_plan_audit_passed", "codex_handoff_valid"},
            "planning gates are exactly the four planning-phase gates")
    for g in ("frontend_implemented", "backend_implemented", "database_implemented",
              "authentication_implemented", "real_ai_integration_verified",
              "frontend_experience_review_passed", "production_like_run_verified"):
        r.check(g in impl, f"'{g}' is an implementation-phase gate")
    r.check(planning.isdisjoint(impl), "planning and implementation gates are disjoint")

    # ---- strengthened validator on a real package ----
    r.check(vpp.validate(FIXTURE, quiet=True) == 0, "ai-saas fixture validates (baseline)")

    with tempfile.TemporaryDirectory() as tmp:
        pkg = _copy_fixture(tmp)
        os.remove(os.path.join(pkg, "ai", "real-ai-integration-plan.yaml"))
        r.check(_validate_silent(pkg) != 0,
                "removing the real-AI-integration plan fails validation (has_ai)")

    with tempfile.TemporaryDirectory() as tmp:
        pkg = _copy_fixture(tmp)
        shutil.rmtree(os.path.join(pkg, "frontend", "screen-contracts"))
        r.check(_validate_silent(pkg) != 0,
                "removing all screen contracts fails validation (has_ui)")

    with tempfile.TemporaryDirectory() as tmp:
        pkg = _copy_fixture(tmp)
        # mark an implementation gate PASS before implementation -> must fail
        with open(os.path.join(pkg, "gate-status.yaml"), "w", encoding="utf-8") as fh:
            fh.write("frontend_implemented: PASS\n")
        r.check(_validate_silent(pkg) != 0,
                "marking an implementation gate PASS before implementation fails validation")

    with tempfile.TemporaryDirectory() as tmp:
        pkg = _copy_fixture(tmp)
        # break vertical-traceability closure: drop all rows
        with open(os.path.join(pkg, "vertical-traceability.yaml"), "w", encoding="utf-8") as fh:
            fh.write("requirements:\n  - requirement_id: FR-001\n    acceptance_criteria: [AC-001]\n    tests: [TEST-001]\n")
        r.check(_validate_silent(pkg) != 0,
                "an incomplete vertical-traceability graph fails validation")

    # ---- artifact presence: schemas / templates / commands / evaluators ----
    for name in ("frontend-reference", "screen-contract", "interaction-contract",
                 "ai-responsibility-matrix", "ai-provider-contract",
                 "real-ai-integration-plan", "vertical-traceability",
                 "implementation-deliverable", "production-readiness",
                 "production-like-run", "visual-quality-review"):
        r.check(os.path.exists(osutil.rel(f"system-building-os/schemas/{name}.schema.json")),
                f"schema '{name}' exists")
    for tid in ("34-frontend-reference-intake", "35-product-intelligence-grill",
                "36-frontend-experience-grill", "37-frontend-plan",
                "43-real-ai-integration-plan", "44-vertical-traceability",
                "45-implementation-deliverables", "46-production-readiness",
                "47-production-like-run"):
        r.check(os.path.exists(osutil.rel(f"system-building-os/templates/{tid}.md")),
                f"template '{tid}' exists")
    for cmd in ("plan_frontend_max", "plan_backend_max", "plan_ai_max",
                "plan_data_max", "plan_reconcile"):
        r.check(os.path.exists(osutil.rel(f".claude/commands/{cmd}.md")),
                f"command '/{cmd}' exists")
    for ev in ("frontend-experience-evaluator", "ai-centrality-evaluator",
               "fake-completion-evaluator", "production-readiness-evaluator",
               "vertical-traceability-evaluator"):
        r.check(os.path.exists(osutil.rel(f"system-building-os/evaluators/{ev}.md")),
                f"evaluator '{ev}' exists")
    r.check(os.path.exists(osutil.rel("system-building-os/policies/production-ready.md")),
            "policy 'production-ready' exists")

    # ---- registry: new skills + agents ----
    skills = {s["name"] for s in
              osutil.load_json("system-building-os/registries/skills.json")["skills"]}
    for s in ("product-logic-and-intelligence-grill", "frontend-experience-grill",
              "frontend-reference-intake", "frontend-screen-contract-planning",
              "frontend-backend-contract-planning", "real-ai-integration-planning",
              "cross-layer-reconciliation", "implementation-deliverables-planning",
              "production-readiness-planning", "ai-interface-implementation",
              "frontend-experience-review", "production-like-run-verification",
              "visual-regression", "creative-ui-concept", "frontend-state-completeness"):
        r.check(s in skills, f"skill '{s}' registered")
    agents = {a["id"] for a in
              osutil.load_json("system-building-os/registries/agents.json")["agents"]}
    for a in ("frontend-experience-reviewer", "production-verification-agent"):
        r.check(a in agents, f"agent '{a}' registered")

    # ---- /plan_max is a closed loop (audit + repair embedded) ----
    orch = next(s for s in
                osutil.load_json("system-building-os/registries/skills.json")["skills"]
                if s["name"] == "plan-max-orchestration")
    proc = " ".join(orch["procedure"]).lower()
    r.check("audit" in proc and "repair" in proc,
            "plan-max-orchestration embeds the audit + repair loop")
    cmd_text = osutil.read_text(osutil.rel(".claude/commands/plan_max.md")).lower()
    r.check("closed loop" in cmd_text and "audit" in cmd_text,
            "/plan_max command describes the closed loop + embedded audit")

    # ---- section-23 scenario detection ----
    def det(slug):
        fx = osutil.load_json(f"tests/fixtures/ideas/{slug}.json")
        return analyze_idea.analyze(fx["signals"], fx["ambiguities"])

    aii = det("ai-first-interview")
    r.check("ai_centrality" in aii["detected_missing_decisions"],
            "ai-first-interview: detects AI-centrality decision")
    r.check("real-ai-integration-planning" in aii["planning_skills_activated"],
            "ai-first-interview: activates real-ai-integration-planning")
    bwf = det("backend-without-frontend")
    r.check("missing_frontend_interface" in bwf["detected_missing_decisions"],
            "backend-without-frontend: detects the missing user-facing interface")
    fsm = det("frontend-static-mocks")
    r.check("fake_data_paths" in fsm["detected_missing_decisions"],
            "frontend-static-mocks: detects fake/static data paths")
    cb = det("chatbot")
    r.check("real-ai-integration-planning" in cb["planning_skills_activated"],
            "chatbot: requires the real provider integration path")

    return r.finish(quiet=True)


if __name__ == "__main__":
    raise SystemExit(main())
