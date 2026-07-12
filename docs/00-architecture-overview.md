# Architecture Overview
The Autonomous System Building OS is a runtime-neutral factory. A single canonical
source of truth (`system-building-os/`) is projected into runtime adapters for
Claude (`.claude/`, planning) and Codex (`.codex/`, `.agents/`, implementation).

Layers:
- **Core** — os-manifest, naming, identifier prefixes.
- **Policies** — autonomy, decision-resolution, secret, deviation, database, MCP, production, context.
- **Lifecycle** — planning + implementation state machines (`state-machine.json`).
- **Contracts** — semantic-adapter, completion-gates, execution-lock, failure-recovery.
- **Schemas** — 25 machine-readable contracts validated by stdlib Python.
- **Registries** — agents, skills, MCPs, community skills, capability classes (single source of truth).
- **Templates** — 34 plan templates with instructions + checklists.
- **Capabilities** — database, auth, frontend, backend, AI, integration, infra, observability, security, performance, failure-recovery.

Everything under a runtime folder is generated. Rebuild with
`python3 scripts/sync_runtime_adapters.py`.
