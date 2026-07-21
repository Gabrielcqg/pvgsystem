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
supabase/migrations/    official versioned database migration source for Supabase
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

## Active Implementation Evidence

This repository currently also contains the Codex implementation artifacts for active plan
`pavageau-sistema-integrado-backend` version `2.5.1`. Evidence, run commands, deviations and the
final implementation report are indexed in [`docs/evidence/README.md`](docs/evidence/README.md).

## Local Docker Preview

The Compose stack starts Postgres, the FastAPI backend, and a Vite viewer for the
vendored frontend reference.

```bash
docker compose up --build
```

Open:

- Frontend reference viewer: http://localhost:5173
- Backend OpenAPI docs: http://localhost:8000/docs
- Backend health check: http://localhost:8000/health

The frontend viewer imports
`plans/active/pavageau-sistema-integrado-backend/vendor/frontend/pavageau_v2.jsx`
and uses its built-in example data. It is not a production frontend wired to the
API; the implemented product scope for this plan is backend/API/database/radar.

Stop the stack:

```bash
docker compose down
```

Reset the local Docker database:

```bash
docker compose down -v
```

## Database Migrations

The official database source is `supabase/migrations/`. Remote deployments use
Supabase migration history, and the local Python runner reads the same directory.
For Docker-only local Postgres, the runner creates a small Supabase compatibility
bootstrap (`auth.jwt`, local roles, and schemas) before applying product
migrations; it does not maintain a separate product schema.
