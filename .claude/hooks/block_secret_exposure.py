#!/usr/bin/env python3
"""Claude PreToolUse hook: block reads/writes of protected paths and commands
that would print secret values. Delegates to scripts/scan_secrets.py (single
source of truth for secret rules). Exit code 2 blocks the tool call."""
import os
import runpy
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
scan = os.path.join(ROOT, "scripts", "scan_secrets.py")
sys.argv = [scan, "--hook"]
runpy.run_path(scan, run_name="__main__")
