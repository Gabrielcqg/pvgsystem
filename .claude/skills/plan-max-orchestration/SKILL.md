---
name: plan-max-orchestration
description: "Drive the full closed-loop /plan_max pipeline and produce the audited Codex package. Triggers: /plan_max invoked; /plan_resume."
---

# plan-max-orchestration

Drive the full closed-loop /plan_max pipeline and produce the audited Codex package.

_Scope: planning · runtime adapter: Claude_

## Procedure
1. Run repository/context preflight; normalize intent; invoke grill-me-planning three passes.
2. Run product-logic-and-intelligence-grill: fix AI-vs-deterministic ownership before specifying.
3. Classify gaps with decision-resolution; resolve A-D, group E questions only.
4. Invoke domain planning agents/skills for EVERY applicable dimension.
5. Run frontend-reference-intake, then frontend-experience-grill, then screen + interaction contracts; when AI is central run real-ai-integration-planning.
6. Run cross-layer-reconciliation (vertical-traceability), implementation-deliverables-planning, and production-readiness-planning.
7. Assemble the numbered plan package under plans/active/<slug>/ with implementation gates PENDING.
8. Embed the independent audit: invoke plan-consistency-judge on the artifacts (not the report); auto-repair critical/major findings; recompute counts/refs/version/hash; re-audit; repeat.
9. Only mark IMPLEMENTATION_READY when the independent judge clears all critical/major findings.

## Checklist
- [ ] Completed: Run repository/context preflight
- [ ] Completed: Run product-logic-and-intelligence-grill: fix AI-vs-deterministic ownership before specifying
- [ ] Completed: Classify gaps with decision-resolution
- [ ] Completed: Invoke domain planning agents/skills for EVERY applicable dimension
- [ ] Completed: Run frontend-reference-intake, then frontend-experience-grill, then screen + interaction contracts
- [ ] Completed: Run cross-layer-reconciliation (vertical-traceability), implementation-deliverables-planning, and production-readiness-planning
- [ ] Completed: Assemble the numbered plan package under plans/active/<slug>/ with implementation gates PENDING
- [ ] Completed: Embed the independent audit: invoke plan-consistency-judge on the artifacts (not the report)
- [ ] Completed: Only mark IMPLEMENTATION_READY when the independent judge clears all critical/major findings

## When NOT to use
- during implementation
- to write product code
- to stop after producing files without auditing content

## Quality bar
output is specific, testable, and traceable; no vague language

## Do not
- write product code
- expose secrets
- start implementation

> Canonical definition: `system-building-os/skills/planning/plan-max-orchestration.md`
