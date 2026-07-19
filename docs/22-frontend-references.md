# How to Use Frontend References

`/plan_max` plans the frontend from a **reference package** in the product
repository. Give it real visual direction and it will follow it; give it nothing
and it will infer a sensible direction and propose one.

## Install the package
```
python3 scripts/install_project_reference.py <path-to-product-repo>
```
This scaffolds:
```
project-reference/
└── frontend/
    ├── FRONTEND_REFERENCE.md   # your visual direction + references (user-customizable)
    ├── design-tokens.yaml      # starting tokens (user-customizable)
    ├── screen-inventory.yaml   # screens you already know you want (user-customizable)
    ├── assets/                 # brand assets / exports (protected)
    └── inspiration/            # screenshots of UIs you like/dislike (protected)
```
Re-running the installer **never overwrites** your files. `--force` only refreshes
project-owned scaffolding, never user references.

## Classify your references
In `FRONTEND_REFERENCE.md`, tag each example:
`MUST FOLLOW` · `STRONG INSPIRATION` · `GENERAL INSPIRATION` · `AVOID`.
Drop screenshots into `inspiration/` and brand files into `assets/`, then reference
them with a note and a classification.

## What Claude does with it
1. `frontend-reference-intake` reads the package, inspects screenshots/assets, and
   incorporates MUST_FOLLOW rules and non-negotiable visual rules.
2. If the package is absent or empty, Claude infers an initial direction from the
   product, proposes a `FRONTEND_REFERENCE.md`, and asks only grouped material
   visual questions when a choice substantially changes product identity.
3. The plan records, per visual decision, whether it came from **you**, from a
   **reference**, or from Claude's **inference** (`frontend-reference.yaml`,
   validated against `frontend-reference.schema.json`).
4. Codex enforces the reference during implementation via `design-reference-compliance`
   and the `frontend_experience_review_passed` gate.

The factory holds only the templates; your project-specific references live in the
product repository and are protected from regeneration.
