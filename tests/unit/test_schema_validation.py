#!/usr/bin/env python3
"""Schema-validation tests: valid artifacts pass and malformed artifacts fail
(negative tests), proving the vendored validator actually enforces contracts."""
from __future__ import annotations

import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(ROOT, "scripts", "lib"))
import jsonschema_lite  # noqa: E402
import osutil  # noqa: E402


def schema(name):
    return osutil.load_json(f"system-building-os/schemas/{name}.schema.json")


def main() -> int:
    r = osutil.Reporter("schema-validation")

    # requirement: valid vs missing required + bad enum
    req_ok = {"id": "FR-001", "title": "t", "description": "d",
              "acceptance_criteria": ["AC-001"], "priority": "must"}
    r.check(not jsonschema_lite.validate(req_ok, schema("requirement")),
            "valid requirement passes")
    r.check(jsonschema_lite.validate({"id": "FR-001", "title": "t"}, schema("requirement")),
            "requirement missing required fields fails")
    r.check(jsonschema_lite.validate(dict(req_ok, priority="maybe"), schema("requirement")),
            "requirement with bad priority enum fails")
    r.check(jsonschema_lite.validate(dict(req_ok, id="XX-1"), schema("requirement")),
            "requirement with bad id pattern fails")

    # task-manifest: assigned_agent required
    tm_ok = {"tasks": [{"id": "TASK-001", "title": "t", "objective": "o",
                        "requirements": ["FR-001"], "assigned_agent": "backend-api-builder",
                        "acceptance_criteria": ["AC-001"], "validation_commands": ["x"]}]}
    r.check(not jsonschema_lite.validate(tm_ok, schema("task-manifest")),
            "valid task manifest passes")
    bad = {"tasks": [{"id": "TASK-001", "title": "t", "objective": "o",
                      "requirements": ["FR-001"], "acceptance_criteria": ["AC-001"],
                      "validation_commands": ["x"]}]}
    r.check(jsonschema_lite.validate(bad, schema("task-manifest")),
            "task manifest missing assigned_agent fails")

    # acceptance-criteria: verification enum
    ac_ok = {"criteria": [{"id": "AC-001", "requirement": "FR-001", "action": "a",
                           "expected_result": "e", "verification": "automated"}]}
    r.check(not jsonschema_lite.validate(ac_ok, schema("acceptance-criteria")),
            "valid acceptance criteria passes")
    r.check(jsonschema_lite.validate(
        {"criteria": [{"id": "AC-001", "requirement": "FR-001", "action": "a",
                       "expected_result": "e", "verification": "wishful"}]},
        schema("acceptance-criteria")),
            "acceptance criteria with bad verification enum fails")

    # mcp-registry: access_mode enum + required fallback
    r.check(jsonschema_lite.validate(
        {"mcps": [{"id": "x", "name": "n", "category": "c", "purpose": "p",
                   "required_for_project": True, "access_mode": "godmode",
                   "fallback": "f"}]}, schema("mcp-registry")),
            "mcp with invalid access_mode fails")

    # data-model: entity needs >=1 field
    r.check(jsonschema_lite.validate(
        {"entities": [{"id": "DB-001", "name": "X", "fields": []}]},
        schema("data-model")),
            "data-model entity with zero fields fails")

    # deviation: level range
    r.check(jsonschema_lite.validate(
        {"id": "DEV-001", "level": 5, "summary": "s", "reason": "r"},
        schema("deviation")),
            "deviation with out-of-range level fails")

    return r.finish(quiet=True)


if __name__ == "__main__":
    raise SystemExit(main())
