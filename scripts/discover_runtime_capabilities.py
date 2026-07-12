#!/usr/bin/env python3
"""Detect installed Claude Code and Codex versions and refresh
system-building-os/runtime/runtime-capabilities.json.

Only the `detected_version`, `generated_at`, and `adapter_generation_timestamp`
fields are refreshed; the capability descriptions are curated and preserved.
Never prints or stores secrets.
"""
from __future__ import annotations

import datetime
import json
import os
import shutil
import subprocess
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "lib"))
import osutil  # noqa: E402

CAP = "system-building-os/runtime/runtime-capabilities.json"


def _version(cmd: list[str]) -> str:
    exe = shutil.which(cmd[0])
    if not exe:
        return "not-detected"
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=20)
        return (out.stdout or out.stderr).strip().splitlines()[0] if (out.stdout or out.stderr) else "unknown"
    except Exception as exc:  # noqa: BLE001
        return f"error: {exc}"


def main() -> int:
    now = datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0).isoformat()
    detected = {
        "claude": _version(["claude", "--version"]),
        "codex": _version(["codex", "--version"]),
    }
    data = osutil.load_json(CAP)
    data["generated_at"] = now
    for rt in data["runtimes"]:
        name = rt["runtime"]
        if name in detected and detected[name] != "not-detected":
            rt["detected_version"] = detected[name]
        rt["adapter_generation_timestamp"] = now
    with open(osutil.rel(CAP), "w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=2)
        fh.write("\n")
    print(f"Updated {CAP}")
    for k, v in detected.items():
        print(f"  {k}: {v}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
