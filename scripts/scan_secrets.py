#!/usr/bin/env python3
"""Secret scanner (stdlib only). Two roles:

1. CLI / CI:   python3 scripts/scan_secrets.py [path ...]
   Scans tracked text files (default: whole repo) for protected-path matches and
   high-signal secret patterns. Reports ONLY metadata (path + rule), never the
   secret value. Non-zero exit if any finding.

2. Claude PreToolUse hook:  python3 scripts/scan_secrets.py --hook
   Reads a tool-call JSON payload on stdin and blocks reads/writes of protected
   paths or commands that would print secret values (exit code 2 blocks).

Used by: secret-policy, the block_secret_exposure hook, and the Codex task gate.
"""
from __future__ import annotations

import fnmatch
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROTECTED_FILE = os.path.join(ROOT, "system-building-os", "policies", "protected-paths.txt")

# High-signal secret value patterns (match the *value*, not just var names).
SECRET_PATTERNS = [
    ("aws_access_key_id", re.compile(r"AKIA[0-9A-Z]{16}")),
    ("github_pat", re.compile(r"ghp_[A-Za-z0-9]{36}")),
    ("github_fine_pat", re.compile(r"github_pat_[A-Za-z0-9_]{60,}")),
    ("slack_token", re.compile(r"xox[baprs]-[A-Za-z0-9-]{10,}")),
    ("google_api_key", re.compile(r"AIza[0-9A-Za-z_\-]{35}")),
    ("private_key_block", re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----")),
    ("stripe_secret", re.compile(r"sk_live_[0-9A-Za-z]{16,}")),
    ("generic_bearer", re.compile(r"(?i)bearer\s+[A-Za-z0-9._\-]{24,}")),
    # An assigned secret literal — but NOT an env-var reference (${VAR}) or a
    # <placeholder>; those are safe templates the OS uses everywhere.
    ("assigned_secret", re.compile(
        r"(?i)(password|passwd|secret|api[_-]?key|token)\s*[:=]\s*"
        r"['\"](?!\$\{)(?!<)(?!\s*['\"])[^'\"]{8,}['\"]")),
]

# Env-var names that must never be printed via shell (from the secrets manifest
# + generic high-signal names). Used by the PreToolUse command guard.
SECRET_VAR_RE = re.compile(
    r"\b(TOKEN|SECRET|PASSWORD|PASSWD|CREDENTIAL|PRIVATE_KEY|DATABASE_URL|"
    r"ACCESS_KEY|API_?KEY|SESSION_SECRET|AUTH_TOKEN)\b", re.IGNORECASE)

SKIP_DIRS = {".git", "node_modules", "__pycache__", ".venv", "venv", "dist", "build"}
TEXT_EXT = {".py", ".js", ".ts", ".tsx", ".jsx", ".json", ".yaml", ".yml", ".md",
            ".txt", ".toml", ".ini", ".cfg", ".sh", ".env", ".sql", ".html", ".css"}


def load_protected_globs() -> tuple[list[str], list[str]]:
    globs, negations = [], []
    with open(PROTECTED_FILE, encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if line.startswith("!"):
                negations.append(line[1:])
            else:
                globs.append(line)
    return globs, negations


def is_protected(path: str, globs, negations) -> bool:
    base = os.path.basename(path)
    for neg in negations:
        if fnmatch.fnmatch(base, neg) or fnmatch.fnmatch(path, neg):
            return False
    for g in globs:
        if fnmatch.fnmatch(base, g) or fnmatch.fnmatch(path, g):
            return True
    return False


def scan_text(path: str) -> list[str]:
    findings = []
    try:
        with open(path, encoding="utf-8", errors="ignore") as fh:
            text = fh.read()
    except (OSError, UnicodeError):
        return findings
    # Allow env-var NAMES and .example templates without values.
    if path.endswith(".example") or os.path.basename(path) == ".env.example":
        return findings
    for rule, pat in SECRET_PATTERNS:
        if pat.search(text):
            findings.append(rule)
    return findings


def cli(paths: list[str]) -> int:
    globs, negations = load_protected_globs()
    targets = paths or [ROOT]
    findings: list[tuple[str, str]] = []
    for target in targets:
        target = target if os.path.isabs(target) else os.path.join(ROOT, target)
        if os.path.isfile(target):
            files = [target]
        else:
            files = []
            for dp, dns, fns in os.walk(target):
                dns[:] = [d for d in dns if d not in SKIP_DIRS]
                for fn in fns:
                    files.append(os.path.join(dp, fn))
        for f in files:
            rel = os.path.relpath(f, ROOT)
            if is_protected(f, globs, negations):
                # protected files should not be committed at all
                if os.path.basename(f) not in ("protected-paths.txt",):
                    findings.append((rel, "protected-path-present"))
                continue
            ext = os.path.splitext(f)[1]
            if ext in TEXT_EXT or ext == "":
                for rule in scan_text(f):
                    findings.append((rel, rule))
    if findings:
        print("SECRET SCAN: findings (metadata only, values never shown):")
        for rel, rule in findings:
            print(f"  FINDING  {rel}  [{rule}]")
        return 1
    print("SECRET SCAN: clean")
    return 0


def hook() -> int:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        return 0
    globs, negations = load_protected_globs()
    tool = payload.get("tool_name") or payload.get("tool") or ""
    ti = payload.get("tool_input") or payload.get("input") or {}
    # File tools
    for key in ("file_path", "path", "notebook_path"):
        p = ti.get(key)
        if p and is_protected(p, globs, negations):
            print(f"BLOCKED: '{p}' is a protected/secret path (secret-policy).", file=sys.stderr)
            return 2
    # Command tools that would print secret FILES
    cmd = ti.get("command", "")
    if cmd and re.search(r"\b(cat|head|tail|less|more|xxd|od|strings)\b[^|;&]*"
                         r"(\.env(\b|$)|\.pem|\.key|id_rsa|id_ed25519|credentials|\.p12|\.pfx)", cmd):
        if ".env.example" not in cmd:
            print("BLOCKED: command may print secret file contents (secret-policy).", file=sys.stderr)
            return 2
    # Commands that dump ALL env vars, or print a secret-named env var
    if cmd and re.search(r"(^|\|\s*)(printenv|env)\s*($|\|)", cmd):
        print("BLOCKED: command dumps all environment variables (secret-policy).", file=sys.stderr)
        return 2
    if cmd and re.search(r"\b(printenv|echo)\b", cmd) and SECRET_VAR_RE.search(cmd):
        print("BLOCKED: command may print a secret env var value (secret-policy).", file=sys.stderr)
        return 2
    return 0


def main(argv: list[str]) -> int:
    if argv and argv[0] == "--hook":
        return hook()
    return cli(argv)


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
