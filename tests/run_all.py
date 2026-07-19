#!/usr/bin/env python3
"""Factory test suite for the Autonomous System Building OS.

Runs every structural validator and unit test and reports a single PASS/FAIL.
No external dependencies (stdlib only). Exit 0 iff everything passes.
"""
from __future__ import annotations

import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PY = sys.executable

# (label, argv) — validators + unit tests. Order: rebuild-agnostic checks first.
SUITE = [
    ("schemas", ["scripts/validate_schemas.py"]),
    ("state-machine", ["scripts/validate_state_machine.py"]),
    ("agent-contracts", ["scripts/validate_agent_contracts.py"]),
    ("skill-contracts", ["scripts/validate_skill_contracts.py"]),
    ("runtime-parity", ["scripts/validate_runtime_parity.py"]),
    ("runtime-config", ["scripts/validate_runtime_config.py"]),
    ("plan-package:internal-crud", ["scripts/validate_plan_package.py",
                                    "tests/fixtures/plan-packages/internal-crud", "--quiet"]),
    ("plan-package:ai-saas", ["scripts/validate_plan_package.py",
                              "tests/fixtures/plan-packages/ai-saas", "--quiet"]),
    ("unit:dry-run", ["tests/unit/test_dry_run.py"]),
    ("unit:completion-gates", ["tests/unit/test_completion_gates.py"]),
    ("unit:secret-protection", ["tests/unit/test_secret_protection.py"]),
    ("unit:state-transitions", ["tests/unit/test_state_transitions.py"]),
    ("unit:schema-validation", ["tests/unit/test_schema_validation.py"]),
    ("unit:production-complete", ["tests/unit/test_production_complete.py"]),
]


def run(argv: list[str]) -> tuple[int, str]:
    p = subprocess.run([PY, os.path.join(ROOT, argv[0]), *argv[1:]],
                       capture_output=True, text=True, cwd=ROOT)
    return p.returncode, (p.stdout + p.stderr)


def main() -> int:
    print("=" * 62)
    print(" Autonomous System Building OS — factory test suite")
    print("=" * 62)
    results = []
    for label, argv in SUITE:
        rc, out = run(argv)
        # extract the summary line if present
        summary = ""
        for line in out.splitlines():
            if line.startswith("---") and "passed" in line:
                summary = line.strip("- ")
        status = "PASS" if rc == 0 else "FAIL"
        results.append((label, rc, summary, out))
        print(f"  [{status}] {label:34} {summary}")
        if rc != 0:
            for line in out.splitlines():
                if "FAIL" in line:
                    print(f"         {line.strip()}")

    failed = [r for r in results if r[1] != 0]
    print("=" * 62)
    print(f" {len(results) - len(failed)}/{len(results)} suites passed")
    if failed:
        print(" FAILED SUITES: " + ", ".join(f[0] for f in failed))
    print("=" * 62)
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
