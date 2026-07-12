---
description: Generate or regenerate all Codex adapters and implementation artifacts.
---

# /prepare_codex

Generate or regenerate all Codex adapters and implementation artifacts.

## Steps
1. Run `python3 scripts/sync_runtime_adapters.py` to refresh canonical + Codex adapters.
2. Assemble/refresh the Codex package: PLAN_METADATA, EXECUTION.lock, task manifest, context packets, handoff, start file.
3. Run `python3 scripts/validate_plan_package.py plans/active/<slug>`.
4. Set `EXECUTION.lock` to `implementation_ready` only if validation passes.
5. Report the exact Codex start command.

> Part of the Autonomous System Building OS. Planning runtime = Claude. Never write product code.
