<!-- classification: project-owned -->
# project-reference/

Product-specific reference material that `/plan_max` reads **before** planning.
The factory installer (`scripts/install_project_reference.py`) creates this
package in a product repository. On update it **never overwrites** your files.

```
project-reference/
└── frontend/
    ├── FRONTEND_REFERENCE.md   # user-customizable — your visual direction + references
    ├── design-tokens.yaml      # user-customizable — starting design tokens
    ├── screen-inventory.yaml   # user-customizable — screens you already know you want
    ├── assets/                 # user-customizable — brand assets, exports, logos
    └── inspiration/            # user-customizable — screenshots of UIs you like/dislike
```

## File classifications
- **user-customizable** — belongs to you; the installer creates it once and never
  regenerates or overwrites it. Put your real references here.
- **project-owned** — scaffolding/readme files owned by the product repo; the
  installer only rewrites them with `--force`.
- **protected-from-regeneration** — anything under `assets/` and `inspiration/`
  (your screenshots and brand files) is never touched by the factory.

## How Claude uses it
1. `frontend-reference-intake` inspects this package and classifies every
   reference MUST_FOLLOW / STRONG_INSPIRATION / GENERAL_INSPIRATION / AVOID.
2. If the package is absent or empty, Claude infers an initial direction from the
   product, proposes a `FRONTEND_REFERENCE.md`, and asks only grouped material
   visual questions when a choice substantially changes the product identity.
3. The plan records, per decision, whether it came from you, from a reference
   here, or from Claude's inference.
