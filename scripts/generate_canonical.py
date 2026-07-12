#!/usr/bin/env python3
"""Project the agent/skill registries into canonical human-readable definitions
under system-building-os/agents/<scope>/ and system-building-os/skills/<scope>/.

These canonical files carry the full semantic-adapter contract as frontmatter
plus a readable body. Runtime adapters are generated separately.
"""
from __future__ import annotations

import os
import sys

_LIB = os.path.join(os.path.dirname(os.path.abspath(__file__)), "lib")
sys.path.insert(0, _LIB)
import osutil  # noqa: E402
import render  # noqa: E402

AG_DIR = "system-building-os/agents"
SK_DIR = "system-building-os/skills"


def agent_scope(a: dict) -> str:
    return "planning" if a["runtime_scope"] == ["claude"] else "implementation"


def render_agent(a: dict) -> str:
    fm = render.frontmatter({
        "id": a["id"], "canonical_name": a["canonical_name"], "kind": "agent",
        "runtime_scope": a["runtime_scope"], "model_profile": a["model_profile"],
        "version": a["version"],
    })
    body = [
        f"# {a['canonical_name']} (`{a['id']}`)", "",
        f"**Purpose.** {a['purpose']}", "",
        f"**Runtime scope:** {', '.join(a['runtime_scope'])}  ·  "
        f"**Model profile:** `{a['model_profile']}`", "",
        "## Responsibilities", render.bullets(a["responsibilities"]), "",
        "## Behavioral contract", a["behavioral_contract"], "",
        "## When to use", a["when_to_use"], "",
        "## When not to use", a["when_not_to_use"], "",
        "## Inputs", render.bullets(a["inputs"]), "",
        "## Outputs", render.bullets(a["outputs"]), "",
        "## Allowed tools", render.bullets(a["allowed_tools"]), "",
        "## Disallowed actions", render.bullets(a["disallowed_actions"]), "",
        "## Required skills", render.bullets(a["required_skills"]), "",
        "## File ownership", render.bullets(a["file_ownership"] or ["(read-only / no exclusive ownership)"]), "",
        "## Quality bar", a["quality_bar"], "",
        "## Stop conditions", render.bullets(a["stop_conditions"]), "",
        "## Runtime adapters",
        f"- Claude: {a['claude_adapter']}",
        f"- Codex: {a['codex_adapter']}",
        f"- Compatibility: {a['compatibility_notes']}", "",
    ]
    return fm + "\n\n" + "\n".join(body)


def render_skill(s: dict) -> str:
    fm = render.frontmatter({
        "name": s["name"], "kind": "skill", "scope": s["scope"],
        "runtime_scope": s["runtime_scope"], "version": s["version"],
    })
    body = [
        f"# Skill: `{s['name']}`", "",
        f"**Purpose.** {s['purpose']}", "",
        f"**Scope:** {s['scope']}  ·  **Runtime:** {', '.join(s['runtime_scope'])}", "",
        "## Invocation triggers", render.bullets(s["invocation_triggers"]), "",
        "## When not to use", render.bullets(s["when_not_to_use"]), "",
        "## Expected inputs", render.bullets(s["expected_inputs"]), "",
        "## Required context", s["required_context"], "",
        "## Outputs", render.bullets(s["outputs"]), "",
        "## Procedure", render.numbered(s["procedure"]), "",
        "## Checklist", "\n".join(f"- [ ] {c}" for c in s["checklist"]), "",
        "## Quality bar", s["quality_bar"], "",
        "## Failure conditions", render.bullets(s["failure_conditions"]), "",
        "## Allowed tools", render.bullets(s["allowed_tools"]), "",
        "## Disallowed actions", render.bullets(s["disallowed_actions"]), "",
        "## Tool access", s["tool_access"], "",
        "## Test fixtures", render.bullets(s["test_fixtures"]), "",
        "## Runtime adapters",
        f"- Claude: {s['claude_adapter']}",
        f"- Codex: {s['codex_adapter']}",
        f"- Compatibility: {s['compatibility_notes']}", "",
    ]
    return fm + "\n\n" + "\n".join(body)


def main() -> int:
    agents = osutil.load_json("system-building-os/registries/agents.json")["agents"]
    skills = osutil.load_json("system-building-os/registries/skills.json")["skills"]
    na = ns = 0
    for a in agents:
        scope = agent_scope(a)
        render.write(osutil.rel(f"{AG_DIR}/{scope}/{a['id']}.md"), render_agent(a))
        na += 1
    for s in skills:
        render.write(osutil.rel(f"{SK_DIR}/{s['scope']}/{s['name']}.md"), render_skill(s))
        ns += 1
    print(f"canonical: wrote {na} agent defs and {ns} skill defs")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
