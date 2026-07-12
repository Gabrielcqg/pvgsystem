# Rule: Autonomy (Claude)
- Routine, safe, reversible work is pre-authorized: create files, install normal
  deps, run/fix tests, refactor, create local migrations, continue phases.
- Document assumptions instead of asking. Only material product ambiguity is a question.
- Destructive/irreversible commands are gated by `.claude/hooks/guard_destructive.py`.
Canonical: `system-building-os/policies/autonomy.yaml`.
