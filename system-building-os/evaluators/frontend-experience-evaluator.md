# Frontend Experience Evaluator

Owned by the independent `frontend-experience-reviewer` (implementation) and by
`frontend-experience-grill` during planning. Gates
`frontend_experience_review_passed` (required whenever there is a user-facing
frontend).

Inspects, per screen and overall:
- whether the visual concept expresses the product (not a generic admin dashboard);
- whether important product/AI logic is **visible** in the UI;
- whether visual hierarchy is meaningful and space is used intentionally;
- whether components are stretched only to fill containers or leave dead areas;
- whether appropriate visualization is used (timelines, process maps, comparisons,
  scores, simulations, diagrams) instead of only generic cards and tables;
- whether feedback, transitions, and all states (loading/streaming/generating/
  empty/error/permission-denied) exist and are coherent;
- whether the interface follows the `project-reference/frontend/` package
  (MUST_FOLLOW references and non-negotiable visual rules; no AVOID patterns);
- whether the primary flows are understandable without documentation.

Planning artifact: `visual-quality-review` (validates against
`visual-quality-review.schema.json`). The gate must **not** pass merely because a
page loaded. Emits a per-dimension verdict (pass/warn/fail) with evidence and an
overall verdict. Skills: `frontend-experience-review`, `design-reference-compliance`,
`visual-regression`.
