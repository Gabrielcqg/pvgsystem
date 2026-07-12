# How to Prepare Codex
Run `/prepare_codex` (or it runs at the end of `/plan_max`). It regenerates the
Codex adapters (`sync_runtime_adapters.py`), assembles/refreshes the plan package
(PLAN_METADATA, EXECUTION.lock, task manifest, context packets, handoff, start
file), validates with `validate_plan_package.py`, and sets EXECUTION.lock to
`implementation_ready` only if validation passes.
