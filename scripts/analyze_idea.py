#!/usr/bin/env python3
"""Deterministic planning preflight analyzer.

Given an idea fixture (signals about a product idea), this computes — WITHOUT an
LLM — which planning skills /plan_max would activate, which system dimensions
still need a decision, and which material (Category E) questions must be asked.
It reflects the real OS by reading the skill registry, so tests verify factory
mechanics deterministically. It never emits product code.

Usage:  python3 scripts/analyze_idea.py <idea-fixture.json>
Import: analyze(signals: dict, ambiguities: list) -> dict
"""
from __future__ import annotations

import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "lib"))
import osutil  # noqa: E402

# Always-on planning skills (grill is mandatory; these run for every idea). The
# closed-loop update adds the intelligence grill, cross-layer reconciliation,
# deliverables, and production-readiness — they run for every plan.
ALWAYS = [
    "plan-max-orchestration", "grill-me-planning", "product-discovery",
    "requirement-extraction", "requirement-completeness-audit", "decision-resolution",
    "assumption-management", "user-flow-planning", "business-rule-specification",
    "technical-architecture-planning", "backend-api-planning", "test-strategy-planning",
    "task-decomposition", "agent-assignment", "skill-assignment",
    "file-ownership-planning", "context-packet-generation", "codex-handoff-generation",
    "plan-consistency-validation", "requirement-traceability", "environment-strategy",
    "infrastructure-planning", "observability-planning", "performance-budget-planning",
    "product-logic-and-intelligence-grill", "cross-layer-reconciliation",
    "implementation-deliverables-planning", "production-readiness-planning",
]
# Conditional skill activation keyed on idea signals.
CONDITIONAL = {
    "stores_data": ["data-architecture-planning", "database-selection", "migration-planning"],
    "multi_user": ["auth-authorization-planning", "security-threat-model-planning"],
    "has_ui": ["frontend-uiux-planning", "responsive-design-planning",
               "accessibility-planning", "motion-performance-planning",
               "frontend-reference-intake", "frontend-experience-grill",
               "frontend-screen-contract-planning", "frontend-backend-contract-planning"],
    "uses_ai": ["ai-flow-planning", "ai-evaluation-planning"],
    "ai_central": ["real-ai-integration-planning"],
    "missing_frontend": ["frontend-uiux-planning", "frontend-experience-grill",
                         "frontend-screen-contract-planning"],
    "static_mocks": ["frontend-backend-contract-planning"],
    "external_integrations": ["integration-planning", "mcp-governance-planning"],
}
# Which decisions a signal implies must be resolved (gap detection).
DECISION_FOR = {
    "stores_data": "database",
    "multi_user": "authentication",
    "has_ui": "frontend_states",
    "uses_ai": "ai_output_validation",
    "external_integrations": "integration_fallback",
    # closed-loop update: AI centrality, missing UI, and fake-data detection
    "ai_central": "ai_centrality",
    "missing_frontend": "missing_frontend_interface",
    "static_mocks": "fake_data_paths",
}
# Material (Category E) ambiguities -> a grouped question.
MATERIAL_QUESTIONS = {
    "internal_vs_customer_facing": "Is the system internal-only or customer-facing?",
    "multi_tenant": "Do multiple organizations share one platform (multi-tenant)?",
    "ai_advisory_vs_auto": "Is AI output advisory or automatically executed?",
    "editable_after_submit": "Can users modify records after submission?",
    "payment_model": "Is payment one-time or subscription-based?",
    "legal_approval_in_core": "Is a legal approval step required in the core workflow?",
}


def _skill_names() -> set[str]:
    reg = osutil.load_json("system-building-os/registries/skills.json")["skills"]
    return {s["name"] for s in reg}


def analyze(signals: dict, ambiguities: list) -> dict:
    known = _skill_names()
    activated = list(ALWAYS)
    for sig, skills in CONDITIONAL.items():
        if signals.get(sig):
            activated += skills
    activated = [s for s in dict.fromkeys(activated) if s in known]

    detected_gaps = ["backend_behavior"]  # always specify backend behavior
    for sig, decision in DECISION_FOR.items():
        if signals.get(sig):
            detected_gaps.append(decision)

    questions = [MATERIAL_QUESTIONS[a] for a in ambiguities if a in MATERIAL_QUESTIONS]

    return {
        "grill_runs": True,
        "planning_skills_activated": sorted(activated),
        "detected_missing_decisions": sorted(set(detected_gaps)),
        "material_questions": questions,
        "asks_material_question": bool(questions),
        "produces_product_code": False,
        "generates_task_manifest": True,
        "generates_traceability": True,
        "generates_codex_agents_and_skills": True,
    }


def main(argv: list[str]) -> int:
    if not argv:
        print(__doc__)
        return 2
    fx = osutil.load_json(argv[0]) if os.path.isabs(argv[0]) else osutil.load_json(argv[0])
    result = analyze(fx.get("signals", {}), fx.get("ambiguities", []))
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
