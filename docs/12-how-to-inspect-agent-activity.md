# How to Inspect Agent Activity
Subagent completions are logged by the `log_phase` hook (Claude) and the
execution ledger (Codex). Each agent has an output contract (see its canonical
def under `system-building-os/agents/`). Phase logs live in `runtime/phase-logs/`.
