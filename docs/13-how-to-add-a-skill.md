# How to Add a Skill
1. Add an entry to the `SKILLS` table in `scripts/gen_registries.py` (name, scope,
   purpose, procedure, triggers, when-not).
2. Run `python3 scripts/sync_runtime_adapters.py` to regenerate the registry,
   canonical def, and runtime adapter(s).
3. Add a test fixture under `tests/fixtures/skills/` if desired.
Shared skills (scope `shared`) automatically project to both runtimes.
