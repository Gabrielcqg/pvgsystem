#!/usr/bin/env python3
"""Claude UserPromptSubmit hook: detect attempts to jump from idea to product
code without a plan. Advisory (non-blocking): it injects a reminder to use
/plan_max when the prompt looks like an implementation request and no active,
implementation-ready plan exists. Never blocks — this OS values autonomy, but
the canonical rule is 'never jump from idea directly to product code'.
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ACTIVE = os.path.join(ROOT, "plans", "active")

BUILD_INTENT = re.compile(
    r"\b(build|implement|create|code|develop|scaffold|ship|write)\b.*\b"
    r"(app|application|feature|api|endpoint|frontend|backend|database|schema|"
    r"page|screen|dashboard|saas|product|system|service|integration)\b",
    re.IGNORECASE,
)
PLANNING_OK = re.compile(r"/plan_max|/plan_resume|/prepare_codex|plan[_ -]?max|system building os", re.IGNORECASE)


def has_ready_plan() -> bool:
    if not os.path.isdir(ACTIVE):
        return False
    for slug in os.listdir(ACTIVE):
        lock = os.path.join(ACTIVE, slug, "EXECUTION.lock")
        if os.path.exists(lock):
            try:
                with open(lock, encoding="utf-8") as fh:
                    if "implementation_ready" in fh.read():
                        return True
            except OSError:
                pass
    return False


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        return 0
    prompt = payload.get("prompt") or payload.get("user_prompt") or ""
    if PLANNING_OK.search(prompt) or has_ready_plan():
        return 0
    if BUILD_INTENT.search(prompt):
        reminder = (
            "Reminder (Autonomous System Building OS): this looks like an "
            "implementation request but there is no implementation-ready active "
            "plan. The canonical rule is to never jump from idea to product code. "
            "Run /plan_max <idea> first so Codex receives a deterministic package. "
            "If you are intentionally extending the OS itself (not building a "
            "product), continue."
        )
        # UserPromptSubmit: stdout is added to context as additional guidance.
        print(json.dumps({"decision": "allow", "reason": reminder}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
