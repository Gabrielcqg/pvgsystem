---
name: secret-scanning
description: "Scan for secret exposure in files, diffs, and command output. Triggers: before any file read/write/commit; CI."
---

# secret-scanning

Scan for secret exposure in files, diffs, and command output.

_Scope: shared · runtime adapter: Claude_

## Procedure
1. Match protected-path patterns and known secret signatures.
2. Block reads/writes/commits that would expose secrets.
3. Report only metadata (never the secret value).

## Checklist
- [ ] Completed: Match protected-path patterns and known secret signatures
- [ ] Completed: Block reads/writes/commits that would expose secrets
- [ ] Completed: Report only metadata (never the secret value)

## When NOT to use
- during product discovery

## Quality bar
output is specific, testable, and traceable; no vague language

## Do not
- expose secrets
- reinterpret product scope

> Canonical definition: `system-building-os/skills/shared/secret-scanning.md`
