# How Canonical Artifacts Work
Each agent/skill carries: id, canonical_name, kind, runtime_scope, purpose,
behavioral_contract, inputs, outputs, allowed_tools, disallowed_actions,
quality_bar, stop_conditions, claude_adapter, codex_adapter, compatibility_notes,
version (see `contracts/semantic-adapter.md`). Skills additionally carry a
runnable procedure and checklist. Planning items are Claude-scoped, implementation
items Codex-scoped, and shared items project to both runtimes.
