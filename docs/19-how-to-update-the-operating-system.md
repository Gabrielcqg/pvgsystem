# How to Update the OS
Edit the canonical layer (`policies/`, `registries/`, `templates/`, `schemas/`
via their generators) and run `python3 scripts/sync_runtime_adapters.py` then
`python3 tests/run_all.py`. Bump versions where relevant. Never edit generated
adapters directly. Keep the root instruction files (`CLAUDE.md`, `AGENTS.md`)
concise; move procedures into skills/docs.
