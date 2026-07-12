#!/usr/bin/env python3
"""Regenerate all canonical definitions and runtime adapters from the registries,
then run parity + contract validation. Single command to rebuild projections.
"""
from __future__ import annotations

import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))

STEPS = [
    ["gen_registries.py"],
    ["generate_canonical.py"],
    ["generate_claude_adapter.py"],
    ["generate_codex_adapter.py"],
    ["validate_agent_contracts.py"],
    ["validate_skill_contracts.py"],
    ["validate_runtime_parity.py"],
]


def main() -> int:
    rc = 0
    for step in STEPS:
        script = os.path.join(HERE, step[0])
        print(f"\n$ python3 scripts/{step[0]}")
        result = subprocess.run([sys.executable, script, *step[1:]])
        if result.returncode != 0:
            rc = result.returncode
    print("\n=== sync complete ===" if rc == 0 else "\n=== sync finished with failures ===")
    return rc


if __name__ == "__main__":
    raise SystemExit(main())
