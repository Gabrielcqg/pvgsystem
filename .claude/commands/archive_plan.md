---
description: Move a completed or superseded plan into the archive without losing lineage.
argument-hint: <plan slug>
---

# /archive_plan

Move a completed or superseded plan into the archive without losing lineage.

## Input
$ARGUMENTS

## Steps
1. Confirm the plan is completed or superseded.
2. Move `plans/active/<slug>` to `plans/archived/<slug>` (or `plans/completed/<slug>` if fully delivered).
3. Preserve PLAN_METADATA lineage (version, superseded_version, hashes).
4. Update any pointers; never delete history.

> Part of the Autonomous System Building OS. Planning runtime = Claude. Never write product code.
