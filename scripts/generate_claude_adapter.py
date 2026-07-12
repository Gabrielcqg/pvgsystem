#!/usr/bin/env python3
"""Generate Claude Code runtime adapters from the canonical registries.

Produces:
  .claude/agents/<id>.md          for every claude-scoped (planning) agent
  .claude/skills/<name>/SKILL.md  for every skill whose runtime_scope includes claude

Claude Code agent/skill files use YAML frontmatter (name, description) + a body.
This is a semantic projection: only planning agents become Claude subagents;
shared skills produce a Claude adapter here and a Codex adapter separately.
"""
from __future__ import annotations

import os
import sys

_LIB = os.path.join(os.path.dirname(os.path.abspath(__file__)), "lib")
sys.path.insert(0, _LIB)
import osutil  # noqa: E402
import render  # noqa: E402

TOOL_MAP = {
    "read": "Read", "write": "Write", "search": "Grep",
    "write_planning_artifacts": "Write", "read_only_mcp": "Read",
}


def claude_tools(allowed: list[str]) -> list[str]:
    out = []
    for t in allowed:
        mapped = TOOL_MAP.get(t)
        if mapped and mapped not in out:
            out.append(mapped)
    for base in ("Read", "Write", "Grep", "Glob"):
        if base not in out:
            out.append(base)
    return out


def gen_agent(a: dict) -> None:
    if a["runtime_scope"] != ["claude"]:
        return
    fm = render.frontmatter({
        "name": a["id"],
        "description": a["purpose"] + f" Use when: {a['when_to_use']}.",
        "tools": claude_tools(a["allowed_tools"]),
    })
    body = [
        f"# {a['canonical_name']}", "",
        "You are the **" + a["canonical_name"] + "**, a planning subagent of the "
        "Autonomous System Building OS (Claude planning runtime).", "",
        f"Model profile: `{a['model_profile']}` (map to a concrete model at runtime).", "",
        "## Responsibilities", render.bullets(a["responsibilities"]), "",
        "## Behavioral contract", a["behavioral_contract"] + ".", "",
        "## Required skills (invoke as needed)", render.bullets(a["required_skills"]), "",
        "## Hard rules",
        "- Do NOT write product code. Planning only.",
        "- Never expose secrets; reference env-var names only.",
        "- Resolve Category A–D decisions yourself; only escalate Category E.",
        "- Emit outputs with traceable IDs; leave no material TBD.",
        "",
        "## Stop conditions", render.bullets(a["stop_conditions"]), "",
        "## Disallowed actions", render.bullets(a["disallowed_actions"]), "",
        "> Canonical definition: "
        f"`system-building-os/agents/planning/{a['id']}.md`", "",
    ]
    render.write(osutil.rel(f".claude/agents/{a['id']}.md"), fm + "\n\n" + "\n".join(body))


def gen_skill(s: dict) -> None:
    if "claude" not in s["runtime_scope"]:
        return
    desc = s["purpose"]
    if s["invocation_triggers"]:
        desc += " Triggers: " + "; ".join(s["invocation_triggers"]) + "."
    fm = render.frontmatter({"name": s["name"], "description": desc})
    body = [
        f"# {s['name']}", "",
        s["purpose"], "",
        f"_Scope: {s['scope']} · runtime adapter: Claude_", "",
        "## Procedure", render.numbered(s["procedure"]), "",
        "## Checklist", "\n".join(f"- [ ] {c}" for c in s["checklist"]), "",
        "## When NOT to use", render.bullets(s["when_not_to_use"]), "",
        "## Quality bar", s["quality_bar"], "",
        "## Do not", render.bullets(s["disallowed_actions"]), "",
        "> Canonical definition: "
        f"`system-building-os/skills/{s['scope']}/{s['name']}.md`", "",
    ]
    render.write(osutil.rel(f".claude/skills/{s['name']}/SKILL.md"), fm + "\n\n" + "\n".join(body))


def main() -> int:
    agents = osutil.load_json("system-building-os/registries/agents.json")["agents"]
    skills = osutil.load_json("system-building-os/registries/skills.json")["skills"]
    na = sum(1 for a in agents if a["runtime_scope"] == ["claude"])
    ns = sum(1 for s in skills if "claude" in s["runtime_scope"])
    for a in agents:
        gen_agent(a)
    for s in skills:
        gen_skill(s)
    print(f"claude adapter: {na} agents -> .claude/agents/, {ns} skills -> .claude/skills/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
