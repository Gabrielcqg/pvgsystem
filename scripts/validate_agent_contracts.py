#!/usr/bin/env python3
"""Validate every agent in the registry carries a complete semantic-adapter
contract and that its canonical + runtime adapter files exist and are consistent."""
from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "lib"))
import osutil  # noqa: E402

REQUIRED = [
    "id", "canonical_name", "kind", "runtime_scope", "purpose",
    "behavioral_contract", "responsibilities", "model_profile", "when_to_use",
    "when_not_to_use", "inputs", "outputs", "allowed_tools", "disallowed_actions",
    "quality_bar", "stop_conditions", "required_skills",
    "claude_adapter", "codex_adapter", "compatibility_notes", "version",
]
# Present as a key but may be an empty list (read-only agents own no files).
REQUIRED_PRESENT = ["file_ownership"]
MODEL_CLASSES = {"highest_reasoning", "balanced_reasoning", "fast_read_only",
                 "implementation_heavy", "validation_independent"}


def main() -> int:
    r = osutil.Reporter("agent-contracts")
    agents = osutil.load_json("system-building-os/registries/agents.json")["agents"]
    r.check(len(agents) >= 34, f"registry has >=34 agents (has {len(agents)})")
    planning = [a for a in agents if a["runtime_scope"] == ["claude"]]
    impl = [a for a in agents if a["runtime_scope"] == ["codex"]]
    r.check(len(planning) >= 17, f">=17 planning agents (has {len(planning)})")
    r.check(len(impl) >= 17, f">=17 implementation agents (has {len(impl)})")

    for a in agents:
        aid = a.get("id", "?")
        for f in REQUIRED:
            r.check(f in a and a[f] not in (None, "", []),
                    f"agent {aid}: field '{f}' present")
        for f in REQUIRED_PRESENT:
            r.check(f in a and isinstance(a[f], list),
                    f"agent {aid}: field '{f}' present (may be empty)")
        r.check(a.get("model_profile") in MODEL_CLASSES,
                f"agent {aid}: model_profile is a capability class")
        scope = "planning" if a["runtime_scope"] == ["claude"] else "implementation"
        canon = f"system-building-os/agents/{scope}/{aid}.md"
        r.check(os.path.exists(osutil.rel(canon)), f"agent {aid}: canonical def exists")
        if scope == "planning":
            r.check(os.path.exists(osutil.rel(f".claude/agents/{aid}.md")),
                    f"agent {aid}: Claude adapter exists")
            r.check(not os.path.exists(osutil.rel(f".codex/agents/{aid}.md")),
                    f"agent {aid}: correctly has NO Codex adapter (planning)")
        else:
            r.check(os.path.exists(osutil.rel(f".codex/agents/{aid}.md")),
                    f"agent {aid}: Codex adapter exists")
            r.check(not os.path.exists(osutil.rel(f".claude/agents/{aid}.md")),
                    f"agent {aid}: correctly has NO Claude adapter (implementation)")

    # required named agents from spec
    required_names = {
        "planning-orchestrator", "grill-master", "product-requirements-architect",
        "system-architect", "data-architect", "auth-security-architect",
        "backend-api-architect", "frontend-uiux-architect", "ai-orchestration-architect",
        "integration-mcp-architect", "infrastructure-release-architect",
        "qa-validation-architect", "performance-observability-architect",
        "task-decomposer", "skill-curator", "codex-handoff-writer", "plan-consistency-judge",
        "autonomous-execution-supervisor", "repository-explorer", "implementation-task-runner",
        "frontend-uiux-builder", "backend-api-builder", "database-migration-builder",
        "auth-authorization-builder", "ai-orchestration-builder", "integration-builder",
        "infrastructure-builder", "qa-test-validator", "browser-ui-validator",
        "performance-reviewer", "security-reviewer", "failure-recovery-agent",
        "documentation-writer", "final-acceptance-judge",
    }
    have = {a["id"] for a in agents}
    for name in sorted(required_names):
        r.check(name in have, f"required agent '{name}' present")

    return r.finish(quiet=True)


if __name__ == "__main__":
    raise SystemExit(main())
