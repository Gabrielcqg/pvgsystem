---
description: Update the handoff after a plan version change.
---

# /regenerate_codex_handoff

Update the handoff after a plan version change.

## Steps
1. Detect the plan version/hash change vs the recorded EXECUTION.lock.
2. Increment the plan version and update `PLAN_METADATA.yaml` (preserve prior versions).
3. Regenerate `28-codex-handoff.md` and `29-codex-start.md` and affected context packets.
4. Identify and mark tasks invalidated by the change.
5. Re-run `plan_validate` before re-locking.

> Part of the Autonomous System Building OS. Planning runtime = Claude. Never write product code.
