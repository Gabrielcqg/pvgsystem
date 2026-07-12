#!/usr/bin/env python3
"""Claude Stop / SubagentStop hook: append a phase/subagent completion record to
the active project's execution ledger (or a repo-level ledger if none active).
Deterministic planning-phase + subagent-completion logging. Never blocks."""
import datetime
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ACTIVE = os.path.join(ROOT, "plans", "active")


def ledger_path() -> str:
    if os.path.isdir(ACTIVE):
        slugs = [d for d in os.listdir(ACTIVE)
                 if os.path.isdir(os.path.join(ACTIVE, d))]
        if slugs:
            rt = os.path.join(ACTIVE, sorted(slugs)[0], "runtime")
            os.makedirs(rt, exist_ok=True)
            return os.path.join(rt, "execution-ledger.jsonl")
    rt = os.path.join(ROOT, "system-building-os", "runtime")
    os.makedirs(rt, exist_ok=True)
    return os.path.join(rt, "execution-ledger.jsonl")


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        payload = {}
    record = {
        "ts": datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0).isoformat(),
        "event": payload.get("hook_event_name", "stop"),
        "session_id": payload.get("session_id", ""),
        "subagent": payload.get("subagent_type") or payload.get("agent_type") or "",
        "runtime": "claude",
    }
    try:
        with open(ledger_path(), "a", encoding="utf-8") as fh:
            fh.write(json.dumps(record) + "\n")
    except OSError:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
