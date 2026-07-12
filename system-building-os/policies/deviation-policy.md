# Deviation Policy

Codex may make autonomous implementation decisions. Classify every deviation and
handle it per its level. All deviations of Level 1+ are recorded in the active
plan's deviation log (`runtime/deviations.jsonl` scoped to the project) using
`deviation.schema.json`.

## Level 0 — No meaningful deviation
Formatting, naming, minor internal organization. Proceed silently or log briefly.

## Level 1 — Reversible implementation improvement
Changes implementation details without changing product behavior. Proceed and
log. Examples: substitute a compatible library, adjust module boundaries, improve
caching, improve internal type structure.

## Level 2 — Architectural path change
Changes the technical approach while preserving requirements. Proceed only after:
- recording an ADR (`ADR-###`);
- updating affected technical artifacts;
- updating tasks and tests;
- confirming acceptance criteria remain valid.

Do not ask for routine permission.

## Level 3 — Product behavior change
Changes what the user experiences or what the system must do. Do NOT silently
implement. Preserve the original requirement; seek an implementation that
satisfies the plan. If impossible, record the exact contradiction, complete all
unaffected work, and surface it as a `product-requirement change` requiring a new
plan version.

## Plan immutability boundary
- Implementation-path changes → deviations / ADRs (allowed during implementation).
- Product-requirement changes → require a NEW plan version (Section 22 of spec).
- Codex implements against exactly one explicit plan version and never silently
  edits the active plan.
