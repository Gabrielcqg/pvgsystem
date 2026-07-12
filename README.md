# Autonomous System Building OS

A permanent, reusable, runtime-neutral **operating system for planning and
implementing software systems**. It separates two runtimes:

- **Claude — Planning runtime.** Discovery, adversarial `grill` review, requirement
  extraction, architecture, decomposition, and Codex preparation. Entrypoint: `/plan_max`.
- **Codex — Implementation runtime.** Implementation, testing, repair, validation,
  documentation, and delivery. Entrypoint: *"Implement the active system plan using the implement-max skill."*

> This repository is the **factory**, not a product built by it. Do not implement
> a product here; use it to plan and hand off products.

## The workflow
1. Open Claude Code in this repository.
2. Run `/plan_max <system idea or plan>`.
3. Answer only the grouped **material product** questions, if any.
4. Let Claude complete and validate the planning package under `plans/active/<slug>/`.
5. Open Codex in the same repository.
6. Start implementation: *"Implement the active system plan using the implement-max skill."*
7. Codex continues until all **completion gates** pass.
8. Review the final implementation report.

## One source of truth
The canonical OS lives in [`system-building-os/`](system-building-os/). The
runtime folders `.claude/`, `.codex/`, and `.agents/` are **generated adapters**.
Edit the canonical registries/policies, then regenerate:

```bash
python3 scripts/sync_runtime_adapters.py     # regenerate canonical + adapters + validate
python3 tests/run_all.py                      # run the factory test suite
```

## Layout
```
system-building-os/     canonical source of truth (policies, lifecycle, contracts,
                        schemas, agents, skills, capabilities, templates, registries,
                        evaluators, runtime, documentation)
.claude/                Claude adapters: commands, agents, skills, hooks, settings template
.codex/  .agents/       Codex adapters: agents, skills, config.toml
integrations/mcp/       MCP configuration templates (governed, least privilege)
plans/                  templates + drafts/active/completed/archived plan packages
database/               migration-based database source of truth
scripts/                discovery, adapter generation, and validators (stdlib Python)
tests/                  factory tests + dry-run fixtures
docs/                   how-to documentation
```

## Key properties
- **Semantic adapters:** rules/agents/skills are translated into each runtime's
  native mechanism, not copied. See `system-building-os/contracts/semantic-adapter.md`.
- **Full autonomy for safe work; questions only for material product ambiguity.**
- **Traceability:** every requirement → task → files, and requirement → acceptance → test → evidence.
- **Completion is gated by evidence**, not by file existence.
- **Secrets are never read, printed, or committed** — enforced by hooks + scanner.
- **No external dependencies:** validators are pure stdlib Python 3.

See [`docs/`](docs/) for the full documentation set.
