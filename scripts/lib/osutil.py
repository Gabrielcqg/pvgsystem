"""osutil — shared helpers for Autonomous System Building OS scripts (stdlib only)."""
from __future__ import annotations

import json
import os
import sys
from typing import Any

_HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(_HERE))  # repo root (scripts/lib -> repo)

sys.path.insert(0, _HERE)
import miniyaml  # noqa: E402


class Reporter:
    """Accumulates PASS/FAIL lines for a validator and prints a summary."""

    def __init__(self, title: str):
        self.title = title
        self.passes: list[str] = []
        self.failures: list[str] = []

    def ok(self, msg: str) -> None:
        self.passes.append(msg)

    def fail(self, msg: str) -> None:
        self.failures.append(msg)

    def check(self, cond: bool, msg: str) -> bool:
        (self.ok if cond else self.fail)(msg)
        return cond

    def finish(self, quiet: bool = False) -> int:
        if not quiet:
            print(f"\n=== {self.title} ===")
            for p in self.passes:
                print(f"  PASS  {p}")
        for f in self.failures:
            print(f"  FAIL  {f}")
        total = len(self.passes) + len(self.failures)
        print(f"--- {self.title}: {len(self.passes)}/{total} passed, {len(self.failures)} failed ---")
        return 0 if not self.failures else 1


def rel(path: str) -> str:
    return os.path.join(ROOT, path)


def load_json(path: str) -> Any:
    with open(path if os.path.isabs(path) else rel(path), "r", encoding="utf-8") as fh:
        return json.load(fh)


def load_yaml(path: str) -> Any:
    return miniyaml.load_file(path if os.path.isabs(path) else rel(path))


def load_any(path: str) -> Any:
    p = path if os.path.isabs(path) else rel(path)
    if p.endswith((".yaml", ".yml")):
        return load_yaml(p)
    return load_json(p)


def walk_files(subdir: str, suffix: str) -> list[str]:
    base = rel(subdir)
    out: list[str] = []
    for dirpath, _, names in os.walk(base):
        for n in sorted(names):
            if n.endswith(suffix):
                out.append(os.path.join(dirpath, n))
    return sorted(out)


def read_text(path: str) -> str:
    with open(path if os.path.isabs(path) else rel(path), "r", encoding="utf-8") as fh:
        return fh.read()


def parse_frontmatter(text: str) -> tuple[dict, str]:
    """Parse leading '---' YAML frontmatter from a markdown file."""
    if not text.startswith("---"):
        return {}, text
    end = text.find("\n---", 3)
    if end == -1:
        return {}, text
    fm_text = text[3:end].strip("\n")
    body = text[end + 4 :].lstrip("\n")
    return miniyaml.loads(fm_text) or {}, body
