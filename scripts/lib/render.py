"""Shared rendering helpers for adapter generators (stdlib only)."""
from __future__ import annotations

import os
from typing import Any


def frontmatter(fields: dict[str, Any]) -> str:
    """Render a small, deterministic YAML frontmatter block for adapters.
    Only handles the scalar/list values used by adapters."""
    lines = ["---"]
    for k, v in fields.items():
        if v is None:
            continue
        if isinstance(v, list):
            if not v:
                continue
            rendered = ", ".join(str(x) for x in v)
            lines.append(f"{k}: [{rendered}]")
        elif isinstance(v, bool):
            lines.append(f"{k}: {'true' if v else 'false'}")
        else:
            s = str(v)
            if any(c in s for c in ":#") or s.strip() != s:
                s = '"' + s.replace('"', '\\"') + '"'
            lines.append(f"{k}: {s}")
    lines.append("---")
    return "\n".join(lines)


def bullets(items) -> str:
    return "\n".join(f"- {i}" for i in items) if items else "- (none)"


def numbered(items) -> str:
    return "\n".join(f"{n}. {i}" for n, i in enumerate(items, 1)) if items else "1. (none)"


def write(path: str, content: str) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if not content.endswith("\n"):
        content += "\n"
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(content)
