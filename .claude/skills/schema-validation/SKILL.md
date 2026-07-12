---
name: schema-validation
description: "Validate a JSON/YAML artifact against a canonical schema. Triggers: whenever an artifact is produced."
---

# schema-validation

Validate a JSON/YAML artifact against a canonical schema.

_Scope: shared · runtime adapter: Claude_

## Procedure
1. Select the schema by artifact type.
2. Validate with jsonschema_lite and report errors.
3. Fail the gate on any schema error.

## Checklist
- [ ] Completed: Select the schema by artifact type
- [ ] Completed: Validate with jsonschema_lite and report errors
- [ ] Completed: Fail the gate on any schema error

## When NOT to use
- during product discovery

## Quality bar
output is specific, testable, and traceable; no vague language

## Do not
- expose secrets
- reinterpret product scope

> Canonical definition: `system-building-os/skills/shared/schema-validation.md`
