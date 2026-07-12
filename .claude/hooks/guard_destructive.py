#!/usr/bin/env python3
"""Claude PreToolUse hook: block or warn on destructive repository/data commands.

Autonomy is full for safe, reversible work — but irreversible, wide-blast-radius
commands are gated. Exit 2 blocks; exit 0 allows. This complements (does not
replace) the autonomy policy: routine work is never blocked here.
"""
import json
import re
import sys

# Hard block: irreversible / high-blast-radius.
BLOCK = [
    (r"\brm\s+-rf?\s+(/|~|\$HOME|\*)(\s|$)", "recursive delete of root/home/glob"),
    (r"\brm\s+-rf?\s+\.(\s|$)", "recursive delete of repo root"),
    (r"\bgit\s+push\b.*--force(?!-with-lease)", "force push without lease"),
    (r"\bgit\s+push\b.*\s-f(\s|$)", "force push"),
    (r"\bgit\s+reset\s+--hard\b.*origin", "hard reset to remote (discards local work)"),
    (r"\bgit\s+clean\s+-[a-z]*f[a-z]*d", "git clean -fd (deletes untracked files)"),
    (r"\bDROP\s+DATABASE\b", "DROP DATABASE"),
    (r"\bTRUNCATE\b.*\b(prod|production)\b", "TRUNCATE on production"),
    (r"\bkubectl\s+delete\b.*\b(prod|production)\b", "kubectl delete in production"),
    (r":\(\)\s*\{\s*:\|:&\s*\}", "fork bomb"),
    (r"\bmkfs\b", "filesystem format"),
    (r"\bdd\s+if=.*of=/dev/", "raw disk write"),
]


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        return 0
    ti = payload.get("tool_input") or payload.get("input") or {}
    cmd = ti.get("command", "")
    if not cmd:
        return 0
    for pat, why in BLOCK:
        if re.search(pat, cmd, re.IGNORECASE):
            print(f"BLOCKED destructive command: {why}. "
                  "This is irreversible/high-blast-radius and requires explicit human action.",
                  file=sys.stderr)
            return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
