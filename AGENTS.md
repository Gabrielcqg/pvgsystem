# AGENTS.md — Autonomous System Building OS (Codex implementation runtime)

Codex is the **primary implementation runtime**. Claude produced the plan; you
implement it deterministically. This file is intentionally concise — the plan and
canonical policies are the source of truth.

## Start here
1. Locate the active plan: `plans/active/<slug>/` (the one whose `EXECUTION.lock` is `implementation_ready`).
2. Validate the plan package: `python3 scripts/validate_plan_package.py plans/active/<slug>`.
3. Read `PLAN_METADATA.yaml` and `EXECUTION.lock` (plan version + hash + gates).
4. Read `18-task-manifest.yaml`, then the relevant `23-context-packets/`.
5. Follow `29-codex-start.md`. Entry skill: **implement-max**.

## Implementation contract
- Execute tasks in dependency order using each task's **assigned agent and skills**.
- Use only the task's **context packet**; respect **file ownership** (`22-file-ownership.yaml`) — no conflicting concurrent writes.
- Run **validations after every task and phase**; on failure, run the repair loop (`failure-diagnosis` → `failure-recovery`) — do not stop at the first failure.
- **Do not reinterpret core product behavior.** Make reversible implementation decisions autonomously and **record deviations** (`system-building-os/policies/deviation-policy.md`). Product-behavior changes (Level 3) require a new plan version.
- Protect secrets: run `python3 scripts/scan_secrets.py` as a task gate; use env-var names only. Codex has no native hooks, so this and destructive-command checks run as scripts + CI (see `runtime/runtime-capabilities.json`).
- **Do not declare completion until the completion gates pass** (`system-building-os/contracts/completion-gates.yaml`). Use the **final-acceptance-judge** to compare implementation against the plan before delivery.
- Produce the truthful, evidence-based **final implementation report** (`final-report` schema). Never claim untested success.

## Autonomy & blockers
Routine, safe, reversible work is pre-authorized (`system-building-os/policies/autonomy.yaml`).
For an unavailable external resource, complete all local work, create a mock/interface/fallback,
document the exact blocker, and continue unaffected tasks (`BLOCKED_EXTERNALLY`).

## Where things are
- Codex agents: `.codex/agents/` · Codex skills: `.agents/skills/`.
- Config: `.codex/config.toml` (least-privilege MCP, no secrets).
- Lifecycle/states: `system-building-os/lifecycle/` · gates: `system-building-os/contracts/`.
