# How to Inspect Task Status
Read `plans/active/<slug>/runtime/task-status.yaml` for per-task state, and
`execution-ledger.jsonl` for the event history. `validate_plan_package.py` shows
structural + traceability status. Codex's supervisor reports task statuses,
deviations, and validation status without dumping raw noise.
