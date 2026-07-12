# Source-of-Truth Model
There is exactly one canonical source of truth: `system-building-os/`. Runtime
folders are adapters generated from it. Never hand-edit an adapter; edit the
canonical registry/policy and regenerate.

Registries (`system-building-os/registries/agents.json`, `skills.json`) hold the
full semantic-adapter contract per item. `scripts/generate_canonical.py` writes
human-readable canonical defs; `generate_claude_adapter.py` and
`generate_codex_adapter.py` write runtime adapters. Parity is checked by
`validate_runtime_parity.py`.
