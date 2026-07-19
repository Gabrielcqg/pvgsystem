#!/usr/bin/env python3
"""Factory installer for the product-repository frontend reference package.

Scaffolds `project-reference/` (with `frontend/FRONTEND_REFERENCE.md`,
`design-tokens.yaml`, `screen-inventory.yaml`, `assets/`, `inspiration/`) into a
target product repository from the canonical templates under
`system-building-os/templates/project-reference/`.

Guarantees:
  * user-customizable files are created ONCE and never overwritten on update
    (unless the file is missing). Your visual references are safe.
  * project-owned scaffolding (READMEs) is only rewritten with --force.
  * assets/ and inspiration/ (protected-from-regeneration) are never modified
    beyond ensuring the directory + its .gitkeep exist.

Usage:
  python3 scripts/install_project_reference.py [TARGET_REPO_ROOT] [--force] [--dry-run]

TARGET_REPO_ROOT defaults to the current working directory. It should be the root
of the PRODUCT repository (not this factory).
"""
from __future__ import annotations

import os
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "system-building-os", "templates", "project-reference")

# path (relative to project-reference/) -> classification
CLASSIFICATION = {
    "README.md": "project-owned",
    "frontend/FRONTEND_REFERENCE.md": "user-customizable",
    "frontend/design-tokens.yaml": "user-customizable",
    "frontend/screen-inventory.yaml": "user-customizable",
    "frontend/assets/.gitkeep": "protected-from-regeneration",
    "frontend/inspiration/.gitkeep": "protected-from-regeneration",
}


def _iter_template_files():
    for dirpath, _dirs, files in os.walk(SRC):
        for f in files:
            full = os.path.join(dirpath, f)
            rel = os.path.relpath(full, SRC)
            yield rel, full


def install(target_root: str, force: bool = False, dry_run: bool = False) -> int:
    dest_base = os.path.join(target_root, "project-reference")
    created, skipped, forced = [], [], []
    for rel, src_path in sorted(_iter_template_files()):
        cls = CLASSIFICATION.get(rel, "project-owned")
        dest = os.path.join(dest_base, rel)
        exists = os.path.exists(dest)
        # never overwrite user references or protected assets; only --force may
        # rewrite project-owned scaffolding.
        overwrite = (not exists) or (force and cls == "project-owned")
        if not overwrite:
            skipped.append((rel, cls))
            continue
        if dry_run:
            (forced if exists else created).append((rel, cls))
            continue
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        shutil.copyfile(src_path, dest)
        (forced if exists else created).append((rel, cls))

    print(f"project-reference install -> {dest_base}" + ("  (dry-run)" if dry_run else ""))
    for rel, cls in created:
        print(f"  created  [{cls}] {rel}")
    for rel, cls in forced:
        print(f"  rewrote  [{cls}] {rel}")
    for rel, cls in skipped:
        print(f"  kept     [{cls}] {rel}  (already present — not overwritten)")
    if not force:
        print("\nUser references are preserved across updates. Use --force only to "
              "refresh project-owned scaffolding (never user files).")
    return 0


def main(argv: list[str]) -> int:
    force = "--force" in argv
    dry_run = "--dry-run" in argv
    positional = [a for a in argv if not a.startswith("--")]
    target = os.path.abspath(positional[0]) if positional else os.getcwd()
    if os.path.abspath(target) == ROOT:
        print("NOTE: target is the factory repo itself. The factory builds products; "
              "it is not a product. Point this at a PRODUCT repository root.")
    return install(target, force=force, dry_run=dry_run)


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
