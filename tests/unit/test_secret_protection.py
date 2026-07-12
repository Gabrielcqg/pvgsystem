#!/usr/bin/env python3
"""Secret-protection tests: the scanner blocks protected paths and secret-value
commands, allows normal files, and never emits a secret value. The repository
itself must be secret-clean."""
from __future__ import annotations

import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(ROOT, "scripts", "lib"))
import osutil  # noqa: E402

SCAN = os.path.join(ROOT, "scripts", "scan_secrets.py")
HOOK = os.path.join(ROOT, ".claude", "hooks", "block_secret_exposure.py")


def hook_rc(payload: dict) -> int:
    p = subprocess.run([sys.executable, SCAN, "--hook"], input=json.dumps(payload),
                       capture_output=True, text=True)
    return p.returncode


def main() -> int:
    r = osutil.Reporter("secret-protection")

    r.check(hook_rc({"tool_name": "Read", "tool_input": {"file_path": ".env"}}) == 2,
            "blocks reading .env")
    r.check(hook_rc({"tool_name": "Read", "tool_input": {"file_path": "config/id_rsa"}}) == 2,
            "blocks reading a private key path")
    r.check(hook_rc({"tool_name": "Write", "tool_input": {"file_path": "secrets.yaml"}}) == 2,
            "blocks writing secrets.yaml")
    r.check(hook_rc({"tool_name": "Read", "tool_input": {"file_path": ".env.example"}}) == 0,
            "allows reading .env.example")
    r.check(hook_rc({"tool_name": "Read", "tool_input": {"file_path": "README.md"}}) == 0,
            "allows reading a normal file")
    r.check(hook_rc({"tool_name": "Bash", "tool_input": {"command": "cat .env"}}) == 2,
            "blocks 'cat .env'")
    r.check(hook_rc({"tool_name": "Bash", "tool_input": {"command": "printenv DATABASE_URL"}}) == 2,
            "blocks 'printenv DATABASE_URL'")
    r.check(hook_rc({"tool_name": "Bash", "tool_input": {"command": "ls -la"}}) == 0,
            "allows a normal command")

    # The block_secret_exposure hook wrapper behaves identically
    p = subprocess.run([sys.executable, HOOK], input=json.dumps(
        {"tool_input": {"file_path": ".env"}}), capture_output=True, text=True)
    r.check(p.returncode == 2, "hook wrapper blocks .env")
    r.check(".env" in p.stderr and "=" not in p.stderr.split(".env")[-1][:3],
            "hook wrapper reports metadata only (no secret value)")

    # Repo-wide scan is clean and never prints a value
    p = subprocess.run([sys.executable, SCAN, ROOT], capture_output=True, text=True)
    r.check(p.returncode == 0, "repository is secret-clean")

    # A planted secret value is detected (in a temp scratch file, not committed)
    scratch = os.path.join(ROOT, "tests", "fixtures", "_secret_probe.txt")
    try:
        with open(scratch, "w") as fh:
            fh.write('aws_key = "AKIA' + "A" * 16 + '"\n')
        p = subprocess.run([sys.executable, SCAN, scratch], capture_output=True, text=True)
        r.check(p.returncode == 1, "detects a planted AWS-key-shaped secret")
        r.check("AKIA" not in p.stdout, "detection output does not echo the secret value")
    finally:
        if os.path.exists(scratch):
            os.remove(scratch)

    return r.finish(quiet=True)


if __name__ == "__main__":
    raise SystemExit(main())
