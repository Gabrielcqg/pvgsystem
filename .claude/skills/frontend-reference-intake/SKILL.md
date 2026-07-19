---
name: frontend-reference-intake
description: "Inspect and incorporate the project's frontend reference package before frontend planning. Triggers: Phase 12 (before frontend planning)."
---

# frontend-reference-intake

Inspect and incorporate the project's frontend reference package before frontend planning.

_Scope: planning · runtime adapter: Claude_

## Procedure
1. Read project-reference/frontend/ (FRONTEND_REFERENCE.md, design-tokens.yaml, screen-inventory.yaml, assets/, inspiration/).
2. Classify each reference MUST_FOLLOW/STRONG_INSPIRATION/GENERAL_INSPIRATION/AVOID.
3. If absent/empty, infer a direction from the product and propose a reference file.
4. Ask only grouped material visual questions when identity changes substantially.
5. Record provenance (user/references/inference) for each decision.

## Checklist
- [ ] Completed: Read project-reference/frontend/ (FRONTEND_REFERENCE
- [ ] Completed: Classify each reference MUST_FOLLOW/STRONG_INSPIRATION/GENERAL_INSPIRATION/AVOID
- [ ] Completed: If absent/empty, infer a direction from the product and propose a reference file
- [ ] Completed: Ask only grouped material visual questions when identity changes substantially
- [ ] Completed: Record provenance (user/references/inference) for each decision

## When NOT to use
- to overwrite user references
- to ask reversible visual choices

## Quality bar
output is specific, testable, and traceable; no vague language

## Do not
- write product code
- expose secrets
- start implementation

> Canonical definition: `system-building-os/skills/planning/frontend-reference-intake.md`
