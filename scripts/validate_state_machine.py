#!/usr/bin/env python3
"""Validate the lifecycle state machine: transitions reference declared states,
forbidden transitions are honored, and terminal/initial states are consistent."""
from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "lib"))
import osutil  # noqa: E402

SM = "system-building-os/lifecycle/state-machine.json"


def main() -> int:
    r = osutil.Reporter("state-machine")
    sm = osutil.load_json(SM)

    declared = set()
    for phase in sm["phases"].values():
        declared.update(phase["states"])
    declared.update(sm.get("extra_states", []))

    forbidden = {(t["from"], t["to"]) for t in sm["forbidden_transitions"]}

    for t in sm["transitions"]:
        r.check(t["from"] in declared, f"transition source '{t['from']}' is declared")
        r.check(t["to"] in declared, f"transition target '{t['to']}' is declared")
        r.check(
            (t["from"], t["to"]) not in forbidden,
            f"transition {t['from']}->{t['to']} is not forbidden",
        )
        r.check(bool(t.get("trigger")), f"transition {t['from']}->{t['to']} has a trigger")

    # Reachability: every non-initial/terminal state should be reachable and exit.
    targets = {t["to"] for t in sm["transitions"]}
    sources = {t["from"] for t in sm["transitions"]}
    for phase_name, phase in sm["phases"].items():
        initial = phase["initial"]
        r.check(initial in phase["states"], f"{phase_name}: initial state declared")
        for term in phase["terminal"]:
            r.check(term in phase["states"], f"{phase_name}: terminal '{term}' declared")
        for st in phase["states"]:
            if st == initial:
                continue
            r.check(st in targets, f"{phase_name}: state '{st}' is reachable")
            if st not in phase["terminal"]:
                r.check(st in sources, f"{phase_name}: non-terminal '{st}' can exit")

    # Forbidden transitions must not appear as allowed ones.
    allowed = {(t["from"], t["to"]) for t in sm["transitions"]}
    for f in forbidden:
        r.check(f not in allowed, f"forbidden {f[0]}->{f[1]} is not also allowed")

    return r.finish()


if __name__ == "__main__":
    raise SystemExit(main())
