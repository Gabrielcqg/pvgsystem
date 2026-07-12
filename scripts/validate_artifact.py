#!/usr/bin/env python3
"""Validate a JSON or YAML artifact against a named canonical schema.

Usage:
  python3 scripts/validate_artifact.py <schema-name> <artifact-path> [<artifact-path> ...]

Example:
  python3 scripts/validate_artifact.py task-manifest plans/active/foo/18-task-manifest.yaml
"""
from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "lib"))
import jsonschema_lite  # noqa: E402
import osutil  # noqa: E402

SCHEMA_DIR = "system-building-os/schemas"


def load_schema(name: str) -> dict:
    name = name.replace(".schema.json", "").replace(".schema", "")
    return osutil.load_json(os.path.join(SCHEMA_DIR, f"{name}.schema.json"))


def validate_file(schema_name: str, path: str) -> list[str]:
    schema = load_schema(schema_name)
    data = osutil.load_any(path)
    return jsonschema_lite.validate(data, schema)


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print(__doc__)
        return 2
    schema_name, paths = argv[0], argv[1:]
    rc = 0
    for path in paths:
        errs = validate_file(schema_name, path)
        if errs:
            rc = 1
            print(f"FAIL {path} (schema={schema_name})")
            for e in errs:
                print(f"  - {e}")
        else:
            print(f"PASS {path} (schema={schema_name})")
    return rc


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
