# How to Add an Agent
1. Add an entry to the `AGENTS` table in `scripts/gen_registries.py` (id, scope,
   name, model_profile, purpose, responsibilities, required_skills, file ownership).
2. Run `python3 scripts/sync_runtime_adapters.py`.
Planning agents become Claude subagents; implementation agents become Codex
agents. `validate_agent_contracts.py` enforces the contract.
