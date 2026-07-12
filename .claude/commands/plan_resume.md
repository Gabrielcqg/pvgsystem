---
description: Continue the active planning session from persisted state.
argument-hint: <optional: focus area>
---

# /plan_resume

Continue the active planning session from persisted state.

## Input
$ARGUMENTS

## Steps
1. Read the active project's `runtime/state.json` and `execution-ledger.jsonl`.
2. Determine the current planning state and the next pending phase.
3. Re-load prior artifacts under `plans/active/<slug>/` (do not regenerate completed ones).
4. Continue the `plan-max-orchestration` pipeline from that phase.
5. Do not re-ask answered questions; consult the assumption/decision ledgers.

> Part of the Autonomous System Building OS. Planning runtime = Claude. Never write product code.
