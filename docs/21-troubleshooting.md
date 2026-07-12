# Troubleshooting
- **Validators fail after edits:** you edited a generated adapter; edit the
  canonical source and run `sync_runtime_adapters.py`.
- **Secret scan blocks a read:** the path matches a protected pattern; use
  `.env.example` and env-var names.
- **Plan won't lock:** `validate_plan_package.py` found a critical finding
  (missing schema field, broken traceability, or a TBD in a critical doc).
- **PyYAML missing:** not needed — validators use the vendored stdlib
  `scripts/lib/miniyaml.py`.
- **Codex won't complete:** a required completion gate is FAIL/PENDING; the
  `final-acceptance-judge` reopens the mapped tasks.
