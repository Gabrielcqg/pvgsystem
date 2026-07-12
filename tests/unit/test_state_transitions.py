#!/usr/bin/env python3
"""State-transition tests: forbidden transitions are rejected, the mandated
repair loops are allowed, and premature-completion paths are impossible."""
from __future__ import annotations

import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(ROOT, "scripts", "lib"))
import osutil  # noqa: E402

SM = "system-building-os/lifecycle/state-machine.json"


def main() -> int:
    r = osutil.Reporter("state-transitions")
    sm = osutil.load_json(SM)
    allowed = {(t["from"], t["to"]) for t in sm["transitions"]}
    forbidden = {(t["from"], t["to"]) for t in sm["forbidden_transitions"]}

    def is_allowed(a, b):
        return (a, b) in allowed and (a, b) not in forbidden

    # Allowed repair loops
    for a, b in [("TESTING", "REPAIRING"), ("REPAIRING", "TESTING"),
                 ("IMPLEMENTING", "REPLANNING_IMPLEMENTATION_PATH"),
                 ("REPLANNING_IMPLEMENTATION_PATH", "IMPLEMENTING"),
                 ("VALIDATING_ACCEPTANCE", "REPAIRING")]:
        r.check(is_allowed(a, b), f"allowed transition {a} -> {b}")

    # Forbidden / impossible transitions
    for a, b in [("RECEIVED", "IMPLEMENTING"), ("IMPLEMENTING", "COMPLETED"),
                 ("TESTING", "COMPLETED"), ("VALIDATING_ACCEPTANCE", "COMPLETED"),
                 ("IMPLEMENTATION_READY", "COMPLETED")]:
        r.check(not is_allowed(a, b), f"forbidden transition {a} -> {b} rejected")

    # Completion is only reachable from READY_FOR_DELIVERY
    into_completed = {a for (a, b) in allowed if b == "COMPLETED"}
    r.check(into_completed == {"READY_FOR_DELIVERY"},
            f"COMPLETED only reachable from READY_FOR_DELIVERY (got {into_completed})")

    # Planning cannot leap into implementation states
    planning_states = set(sm["phases"]["planning"]["states"])
    impl_states = set(sm["phases"]["implementation"]["states"])
    leaks = {(a, b) for (a, b) in allowed if a in planning_states and b in impl_states}
    r.check(not leaks, f"no direct planning->implementation transition (got {leaks})")

    # External-block recovery exists
    r.check(is_allowed("BLOCKED_EXTERNALLY", "IMPLEMENTING"),
            "can resume from BLOCKED_EXTERNALLY when resource is available")

    return r.finish(quiet=True)


if __name__ == "__main__":
    raise SystemExit(main())
