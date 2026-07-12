# How to Start Codex Implementation
Open Codex in the same repository and say:
**"Implement the active system plan using the implement-max skill."**
Codex reads `AGENTS.md`, locates the active plan, validates the package, reads
`PLAN_METADATA` + `EXECUTION.lock` + the task manifest + context packets, and
executes tasks in dependency order until the completion gates pass.
