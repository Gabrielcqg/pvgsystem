# How Implementation Resumes
State is persisted to the active plan's `runtime/` (`state.json`,
`execution-ledger.jsonl`, `task-status.yaml`, `checkpoints/`, `phase-logs/`). On
restart, the `autonomous-execution-supervisor` reads task status and continues
from the next unblocked task. Completed tasks are not redone; failed tasks are
reopened.
