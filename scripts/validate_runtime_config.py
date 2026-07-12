#!/usr/bin/env python3
"""Validate generated runtime configuration: Claude settings template, Codex
config.toml, hook wiring, and MCP templates. Ensures no secret literals appear
and that referenced hook scripts exist."""
from __future__ import annotations

import json
import os
import re
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "lib"))
import osutil  # noqa: E402

SECRET_LITERAL = re.compile(
    r"(AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36}|sk_live_[0-9A-Za-z]{16,}|-----BEGIN)")


def main() -> int:
    r = osutil.Reporter("runtime-config")

    # Claude settings template is valid JSON with hooks + permissions.
    st_path = ".claude/settings.json.template"
    r.check(os.path.exists(osutil.rel(st_path)), "Claude settings template exists")
    if os.path.exists(osutil.rel(st_path)):
        try:
            st = osutil.load_json(st_path)
            r.check("permissions" in st, "settings: permissions present")
            r.check("hooks" in st, "settings: hooks present")
            # every hook command references an existing script
            for event, entries in st.get("hooks", {}).items():
                for entry in entries:
                    for hook in entry.get("hooks", []):
                        cmd = hook.get("command", "")
                        m = re.search(r"(\.claude/hooks/[\w./-]+\.py|scripts/[\w./-]+\.py)", cmd)
                        if m:
                            r.check(os.path.exists(osutil.rel(m.group(1))),
                                    f"hook script exists: {m.group(1)} ({event})")
        except Exception as exc:  # noqa: BLE001
            r.fail(f"settings template parse error: {exc}")

    # Hook scripts present
    for h in ["block_secret_exposure.py", "guard_destructive.py",
              "detect_plan_skip.py", "log_phase.py"]:
        r.check(os.path.exists(osutil.rel(f".claude/hooks/{h}")), f"hook present: {h}")

    # Codex config exists and declares startup contract, no secret literals
    cfg = ".codex/config.toml"
    r.check(os.path.exists(osutil.rel(cfg)), "Codex config.toml exists")
    if os.path.exists(osutil.rel(cfg)):
        text = osutil.read_text(cfg)
        r.check("approval_policy" in text, "config.toml: approval_policy present")
        r.check("sandbox_mode" in text, "config.toml: sandbox_mode present")
        r.check(not SECRET_LITERAL.search(text), "config.toml: no secret literal")

    # MCP templates present and free of secret literals; use ${VAR} references
    for tmpl in ["integrations/mcp/claude.mcp.json.template",
                 "integrations/mcp/codex.mcp.toml.template"]:
        r.check(os.path.exists(osutil.rel(tmpl)), f"MCP template exists: {tmpl}")
        if os.path.exists(osutil.rel(tmpl)):
            text = osutil.read_text(tmpl)
            r.check(not SECRET_LITERAL.search(text), f"{tmpl}: no secret literal")
            r.check("${" in text, f"{tmpl}: uses env-var references")

    # .env.example has names only (no '=value' with a real-looking value)
    if os.path.exists(osutil.rel(".env.example")):
        for line in osutil.read_text(".env.example").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                _, _, val = line.partition("=")
                r.check(val.strip() == "", f".env.example: '{line.split('=')[0]}' has no value")

    return r.finish(quiet=True)


if __name__ == "__main__":
    raise SystemExit(main())
