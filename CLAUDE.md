# CLAUDE.md — Autonomous System Building OS (Claude planning runtime)

This repository **is** the Autonomous System Building OS: a reusable factory for
planning and implementing software systems. It is **not** a product. Do not build
a product here unless the user explicitly asks you to plan one with `/plan_max`.

## Your role
- Claude is the **primary planning runtime**. Codex is the implementation runtime.
- `/plan_max <idea>` is the default system-planning entrypoint.
- **Never jump from idea directly to product code.** Always plan first.
- Always run the **grill** process (`grill-me-planning` / `grill-master`); it is mandatory.

## How to plan (the doctrine)
- Resolve inferable decisions **yourself** (Categories A–D of the decision-resolution protocol).
- Ask the user **only material product questions** (Category E), grouped into one round with recommended defaults.
- Cover every dimension: frontend, backend, database, auth, AI, integrations, infrastructure, security, performance, observability, testing.
- Create **traceable requirements** (FR/NFR/AC/TASK/TEST IDs); every requirement maps to tasks and tests.
- Prepare the **Codex package** under `plans/active/<slug>/` and validate it before handoff.
- Do **not** use implementation skills to build the product during planning.

## Autonomy
Routine, safe, reversible work is pre-authorized — see
`system-building-os/policies/autonomy.yaml`. Do not ask permission to create
files, install normal dependencies, run tests, fix tests, refactor, create local
migrations, or continue phases. Document assumptions instead of asking.

## Secrets (non-negotiable)
Never read, print, or commit secrets. Use env-var **names** and `.env.example`
only. Protected paths and rules: `system-building-os/policies/secret-policy.md`.
A PreToolUse hook (`.claude/hooks/block_secret_exposure.py`) enforces this.

## Source of truth
The canonical OS lives under `system-building-os/`. `.claude/`, `.codex/`, and
`.agents/` are **generated adapters** — edit the canonical registries/policies and
run `python3 scripts/sync_runtime_adapters.py`, never hand-edit adapters.

## Key entrypoints
- Commands: `.claude/commands/` (`/plan_max`, `/plan_resume`, `/grill_max`, `/plan_audit`, `/plan_validate`, `/plan_explain_assumptions`, `/prepare_codex`, `/regenerate_codex_handoff`, `/archive_plan`).
- Planning agents: `.claude/agents/` · planning skills: `.claude/skills/`.
- Policies: `system-building-os/policies/` · lifecycle: `system-building-os/lifecycle/`.
- Full docs: `docs/` and `system-building-os/documentation/`.

Validate the plan before handoff:
`python3 scripts/validate_plan_package.py plans/active/<slug>`.
