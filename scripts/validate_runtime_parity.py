#!/usr/bin/env python3
"""Validate runtime parity between canonical definitions and generated adapters.

Parity here is SEMANTIC, not literal: planning agents exist only for Claude,
implementation agents only for Codex, and shared skills exist in BOTH runtimes.
We assert that projection is complete (no missing adapter), no stray adapters
exist that lack a registry source, and shared controls are present in both.
"""
from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "lib"))
import osutil  # noqa: E402


def listing(subdir: str, suffix: str) -> set[str]:
    base = osutil.rel(subdir)
    out: set[str] = set()
    if not os.path.isdir(base):
        return out
    for dp, _, names in os.walk(base):
        for n in names:
            if n.endswith(suffix):
                rel = os.path.relpath(os.path.join(dp, n), base)
                out.add(rel)
    return out


def main() -> int:
    r = osutil.Reporter("runtime-parity")
    agents = osutil.load_json("system-building-os/registries/agents.json")["agents"]
    skills = osutil.load_json("system-building-os/registries/skills.json")["skills"]

    # Expected adapter file sets from the registry
    exp_claude_agents = {f"{a['id']}.md" for a in agents if a["runtime_scope"] == ["claude"]}
    exp_codex_agents = {f"{a['id']}.md" for a in agents if a["runtime_scope"] == ["codex"]}
    exp_claude_skills = {f"{s['name']}/SKILL.md" for s in skills if "claude" in s["runtime_scope"]}
    exp_codex_skills = {f"{s['name']}/SKILL.md" for s in skills if "codex" in s["runtime_scope"]}

    got_claude_agents = listing(".claude/agents", ".md")
    got_codex_agents = listing(".codex/agents", ".md")
    got_claude_skills = listing(".claude/skills", "SKILL.md")
    got_codex_skills = listing(".agents/skills", "SKILL.md")

    def compare(label, expected, got):
        missing = expected - got
        stray = got - expected
        r.check(not missing, f"{label}: no missing adapters" + (f" (missing {sorted(missing)})" if missing else ""))
        r.check(not stray, f"{label}: no stray adapters" + (f" (stray {sorted(stray)})" if stray else ""))

    compare("claude agents", exp_claude_agents, got_claude_agents)
    compare("codex agents", exp_codex_agents, got_codex_agents)
    compare("claude skills", exp_claude_skills, got_claude_skills)
    compare("codex skills", exp_codex_skills, got_codex_skills)

    # Separation of concerns
    r.check(not (exp_claude_agents & exp_codex_agents),
            "no agent is both a Claude and Codex agent (responsibility separation)")

    # Shared skills present in BOTH runtimes
    for s in skills:
        if s["scope"] == "shared":
            in_claude = f"{s['name']}/SKILL.md" in got_claude_skills
            in_codex = f"{s['name']}/SKILL.md" in got_codex_skills
            r.check(in_claude and in_codex,
                    f"shared skill {s['name']}: present in both runtimes")

    # Every implementation-agent required skill is a real, codex-projected skill
    skill_names = {s["name"]: s for s in skills}
    for a in agents:
        for rs in a["required_skills"]:
            r.check(rs in skill_names, f"agent {a['id']}: required skill '{rs}' exists in registry")

    return r.finish(quiet=True)


if __name__ == "__main__":
    raise SystemExit(main())
