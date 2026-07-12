#!/usr/bin/env python3
"""MCP health check: for each registered MCP, report whether its referenced
env-var NAME is present in the environment (never prints the value) and show the
declared fallback. Exit 0 always (informational); use in preflight.
"""
from __future__ import annotations

import os
import sys

_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(_ROOT, "scripts", "lib"))
import osutil  # noqa: E402


def main() -> int:
    reg = osutil.load_yaml("system-building-os/registries/mcp-registry.yaml")
    print("MCP health check (env-var presence only; values never shown):\n")
    for mcp in reg["mcps"]:
        ref = mcp.get("authentication_reference", "NONE")
        if ref in ("NONE", None, ""):
            status = "no-auth"
        else:
            status = "SET" if os.environ.get(ref) else "missing"
        print(f"  {mcp['id']:20} auth={ref:20} [{status}]  access={mcp['access_mode']}")
        print(f"       fallback: {mcp['fallback']}")
    print("\nNote: a 'missing' credential is not a blocker — the fallback keeps work moving.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
