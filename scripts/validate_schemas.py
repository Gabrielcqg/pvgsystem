#!/usr/bin/env python3
"""Check that all canonical schemas are well-formed and that the canonical
artifacts which currently exist validate against their schemas."""
from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "lib"))
import jsonschema_lite  # noqa: E402
import osutil  # noqa: E402

EXPECTED = [
    "plan-metadata", "user-intent", "assumption-ledger", "decision-ledger",
    "requirement", "actor", "user-flow", "ui-screen", "business-rule",
    "data-model", "database-plan", "api-contract", "ai-flow", "integration",
    "mcp-registry", "task-manifest", "agent-map", "skill-map", "file-ownership",
    "acceptance-criteria", "traceability", "execution-state", "completion-gates",
    "deviation", "final-report",
    # production-complete update: frontend, AI, reconciliation, deliverables
    "frontend-reference", "design-token", "frontend-state", "screen-contract",
    "component-contract", "interaction-contract", "visual-quality-review",
    "ai-responsibility-matrix", "ai-provider-contract", "real-ai-integration-plan",
    "vertical-traceability", "implementation-deliverable", "production-readiness",
    "production-like-run",
]

# canonical artifacts that always exist in the factory, mapped to their schema
CANONICAL_ARTIFACTS = {
    "system-building-os/contracts/completion-gates.yaml": "completion-gates",
    "system-building-os/registries/mcp-registry.yaml": "mcp-registry",
}


def main() -> int:
    r = osutil.Reporter("schemas")
    present = {
        f[:-len(".schema.json")]
        for f in os.listdir(osutil.rel("system-building-os/schemas"))
        if f.endswith(".schema.json")
    }
    for name in EXPECTED:
        r.check(name in present, f"schema '{name}' exists")
    for name in sorted(present):
        try:
            sch = osutil.load_json(f"system-building-os/schemas/{name}.schema.json")
            ok = isinstance(sch, dict) and "title" in sch and "type" in sch
            r.check(ok, f"schema '{name}' is well-formed (title+type)")
            # smoke: schema must not crash the validator on an empty object
            jsonschema_lite.validate({}, sch)
        except Exception as exc:  # noqa: BLE001
            r.fail(f"schema '{name}' failed to load/parse: {exc}")

    for path, schema_name in CANONICAL_ARTIFACTS.items():
        if os.path.exists(osutil.rel(path)):
            try:
                data = osutil.load_any(path)
                errs = jsonschema_lite.validate(data, osutil.load_json(
                    f"system-building-os/schemas/{schema_name}.schema.json"))
                r.check(not errs, f"artifact {path} validates against {schema_name}"
                        + ("" if not errs else f": {errs[:2]}"))
            except Exception as exc:  # noqa: BLE001
                r.fail(f"artifact {path} error: {exc}")
        else:
            r.check(False, f"canonical artifact {path} exists")

    return r.finish()


if __name__ == "__main__":
    raise SystemExit(main())
