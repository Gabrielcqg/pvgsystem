#!/usr/bin/env python3
"""Validate every skill carries a complete contract (name, description, runtime
scope, purpose, triggers, when-not, inputs, required context, outputs, procedure,
checklist, quality bar, failure conditions, tool access, version, fixtures) and
that canonical + runtime adapter files exist per scope."""
from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "lib"))
import osutil  # noqa: E402

REQUIRED = [
    "name", "kind", "scope", "runtime_scope", "purpose", "invocation_triggers",
    "when_not_to_use", "expected_inputs", "required_context", "outputs",
    "procedure", "checklist", "quality_bar", "failure_conditions", "allowed_tools",
    "disallowed_actions", "tool_access", "test_fixtures", "version",
]

MANDATORY_PLANNING = {
    "plan-max-orchestration", "grill-me-planning", "product-discovery",
    "requirement-extraction", "requirement-completeness-audit", "assumption-management",
    "decision-resolution", "user-flow-planning", "business-rule-specification",
    "technical-architecture-planning", "data-architecture-planning", "database-selection",
    "migration-planning", "auth-authorization-planning", "security-threat-model-planning",
    "backend-api-planning", "frontend-uiux-planning", "responsive-design-planning",
    "accessibility-planning", "motion-performance-planning", "ai-flow-planning",
    "ai-evaluation-planning", "integration-planning", "mcp-governance-planning",
    "infrastructure-planning", "environment-strategy", "observability-planning",
    "performance-budget-planning", "test-strategy-planning", "task-decomposition",
    "agent-assignment", "skill-assignment", "file-ownership-planning",
    "context-packet-generation", "codex-handoff-generation", "plan-consistency-validation",
    "requirement-traceability",
}
MANDATORY_IMPL = {
    "implement-max", "active-plan-reader", "plan-scope-guard", "task-manifest-runner",
    "context-packet-loader", "repository-bootstrap", "dependency-management",
    "frontend-implementation", "frontend-design-fidelity", "responsive-implementation",
    "accessibility-implementation", "backend-api-implementation", "business-logic-implementation",
    "database-schema-implementation", "database-migration-implementation",
    "database-test-and-drift-check", "auth-implementation", "authorization-validation",
    "ai-orchestration-implementation", "ai-output-validation", "integration-implementation",
    "mcp-tool-usage", "infrastructure-implementation", "environment-bootstrap",
    "observability-implementation", "unit-test-loop", "integration-test-loop",
    "e2e-browser-validation", "acceptance-criteria-validation", "performance-audit",
    "security-review", "failure-diagnosis", "failure-recovery", "checkpoint-and-rollback",
    "implementation-deviation-reporting", "phase-completion-reporting",
    "final-plan-comparison", "final-delivery-report",
}


def main() -> int:
    r = osutil.Reporter("skill-contracts")
    skills = osutil.load_json("system-building-os/registries/skills.json")["skills"]
    by_name = {s["name"]: s for s in skills}

    for s in skills:
        name = s.get("name", "?")
        for f in REQUIRED:
            r.check(f in s and s[f] not in (None, "", []),
                    f"skill {name}: field '{f}' present")
        r.check(len(s.get("procedure", [])) >= 3,
                f"skill {name}: procedure has >=3 steps")
        canon = f"system-building-os/skills/{s['scope']}/{name}.md"
        r.check(os.path.exists(osutil.rel(canon)), f"skill {name}: canonical def exists")
        if "claude" in s["runtime_scope"]:
            r.check(os.path.exists(osutil.rel(f".claude/skills/{name}/SKILL.md")),
                    f"skill {name}: Claude adapter exists")
        if "codex" in s["runtime_scope"]:
            r.check(os.path.exists(osutil.rel(f".agents/skills/{name}/SKILL.md")),
                    f"skill {name}: Codex adapter exists")

    for name in sorted(MANDATORY_PLANNING):
        r.check(name in by_name and by_name[name]["scope"] == "planning",
                f"mandatory planning skill '{name}' present")
    for name in sorted(MANDATORY_IMPL):
        r.check(name in by_name and by_name[name]["scope"] == "implementation",
                f"mandatory implementation skill '{name}' present")

    shared = [s for s in skills if s["scope"] == "shared"]
    r.check(len(shared) >= 1, f">=1 shared skill (has {len(shared)})")
    for s in shared:
        r.check(set(s["runtime_scope"]) == {"claude", "codex"},
                f"shared skill {s['name']}: projects to both runtimes")

    return r.finish(quiet=True)


if __name__ == "__main__":
    raise SystemExit(main())
