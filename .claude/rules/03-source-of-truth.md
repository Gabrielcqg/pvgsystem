# Rule: Source of Truth (Claude)
- The canonical OS is `system-building-os/`. `.claude/`, `.codex/`, `.agents/` are generated.
- Never hand-edit an adapter; edit the canonical registry/policy and run
  `python3 scripts/sync_runtime_adapters.py`.
Canonical: `system-building-os/contracts/semantic-adapter.md`.
