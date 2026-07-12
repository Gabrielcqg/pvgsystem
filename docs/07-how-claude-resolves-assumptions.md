# How Claude Resolves Assumptions
Every gap is classified A–F (`policies/decision-resolution.md`). A (explicit) is
used as-is; B (inferable product requirement) is resolved and logged in the
assumption ledger; C/D (reversible technical / non-blocking preference) are
resolved and logged in the decision ledger; E (material ambiguity) becomes a
question; F (external dependency) becomes a planned integration + fallback.
Run `/plan_explain_assumptions` to see the highest-impact assumptions.
