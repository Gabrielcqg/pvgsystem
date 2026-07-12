#!/usr/bin/env python3
"""Generate Codex runtime adapters from the canonical registries.

Produces:
  .codex/agents/<id>.md          for every codex-scoped (implementation) agent
  .agents/skills/<name>/SKILL.md for every skill whose runtime_scope includes codex

Codex has no native event-hook system, so behavioral rules that Claude expresses
via hooks are expressed here via explicit procedure steps, task gates, and
validation-script references. This is a semantic projection, not a file copy.
"""
from __future__ import annotations

import os
import sys

_LIB = os.path.join(os.path.dirname(os.path.abspath(__file__)), "lib")
sys.path.insert(0, _LIB)
import osutil  # noqa: E402
import render  # noqa: E402


def gen_agent(a: dict) -> None:
    if a["runtime_scope"] != ["codex"]:
        return
    fm = render.frontmatter({
        "name": a["id"],
        "description": a["purpose"],
        "model_profile": a["model_profile"],
    })
    body = [
        f"# {a['canonical_name']} (Codex implementation agent)", "",
        a["purpose"], "",
        f"Model profile: `{a['model_profile']}` (map to a concrete model at runtime).", "",
        "## Responsibilities", render.bullets(a["responsibilities"]), "",
        "## Inputs", render.bullets(a["inputs"]), "",
        "## Outputs", render.bullets(a["outputs"]), "",
        "## Required skills", render.bullets(a["required_skills"]), "",
        "## File ownership", render.bullets(a["file_ownership"] or ["(read-only / no exclusive ownership)"]), "",
        "## Hard rules",
        "- Do NOT reinterpret the product's core objective.",
        "- Stay within declared file ownership; avoid conflicting concurrent writes.",
        "- Run validation commands after each task; repair failures autonomously.",
        "- Never expose secrets; run `scripts/scan_secrets.py` as a gate.",
        "- Do not declare completion until completion gates pass.",
        "",
        "## Disallowed actions", render.bullets(a["disallowed_actions"]), "",
        "## Stop conditions", render.bullets(a["stop_conditions"]), "",
        "> Canonical definition: "
        f"`system-building-os/agents/implementation/{a['id']}.md`", "",
    ]
    render.write(osutil.rel(f".codex/agents/{a['id']}.md"), fm + "\n\n" + "\n".join(body))


def gen_skill(s: dict) -> None:
    if "codex" not in s["runtime_scope"]:
        return
    desc = s["purpose"]
    fm = render.frontmatter({"name": s["name"], "description": desc})
    hook_note = ""
    if s["scope"] == "shared":
        hook_note = ("\n> Codex has no native hooks: this shared control runs as a "
                     "task gate + CI step (see runtime-capabilities.json compatibility_decisions).")
    body = [
        f"# {s['name']} (Codex skill)", "",
        s["purpose"] + hook_note, "",
        f"_Scope: {s['scope']} · runtime adapter: Codex_", "",
        "## Procedure (runnable)", render.numbered(s["procedure"]), "",
        "## Inputs it may rely on", render.bullets(s["expected_inputs"]), "",
        "## Files it may own", "Determined by the assigned task's `files_to_create`/`files_to_modify`.",
        "## Files it must not touch", "Anything outside the task's ownership or in protected paths.", "",
        "## Validations it must run", render.bullets(s["allowed_tools"]), "",
        "## Success", s["quality_bar"], "",
        "## Failure / escalate to recovery", render.bullets(s["failure_conditions"]), "",
        "## Return control to supervisor when", "the procedure completes or the failure budget is exhausted.", "",
        "> Canonical definition: "
        f"`system-building-os/skills/{s['scope']}/{s['name']}.md`", "",
    ]
    render.write(osutil.rel(f".agents/skills/{s['name']}/SKILL.md"), fm + "\n\n" + "\n".join(body))


def main() -> int:
    agents = osutil.load_json("system-building-os/registries/agents.json")["agents"]
    skills = osutil.load_json("system-building-os/registries/skills.json")["skills"]
    na = sum(1 for a in agents if a["runtime_scope"] == ["codex"])
    ns = sum(1 for s in skills if "codex" in s["runtime_scope"])
    for a in agents:
        gen_agent(a)
    for s in skills:
        gen_skill(s)
    print(f"codex adapter: {na} agents -> .codex/agents/, {ns} skills -> .agents/skills/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
