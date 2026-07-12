# How to Run /plan_max
In Claude Code: `/plan_max <idea | rough notes | detailed plan | "extend repo">`.
Claude runs the full pipeline (Phases 0–28), resolves inferable decisions
autonomously, asks only material product questions, and assembles a validated
package under `plans/active/<slug>/`. It finishes by printing the plan version,
the completion gates, and the Codex start command. `/plan_max` never writes
product code.
