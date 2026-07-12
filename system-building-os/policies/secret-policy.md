# Secret and Protected-Data Policy

## Never read, print, or commit
- `.env` values
- tokens, API keys
- private keys
- passwords
- session secrets
- production credentials
- service-account keys
- database passwords

The system MAY inspect environment-variable **names** without reading values.

## Required artifacts
- `.env.example` — variable names + descriptions, never values.
- `secrets-manifest.yaml` — metadata only:

```yaml
- name: DATABASE_URL
  purpose: Primary application database connection string
  required_environment: [local, test, development, staging, production]
  consumer: backend
  required_for_local: true
  required_for_production: true
  rotation_notes: Rotate via provider console; update secret store, never git.
```

## Protected-path patterns
See `system-building-os/policies/protected-paths.txt`. These paths must never be
read for their contents, printed, or committed:
`.env`, `.env.*` (except `.env.example`), `*.pem`, `*.key`, `*_rsa`, `id_*`,
`*.p12`, `*.pfx`, `credentials.json`, `service-account*.json`, `*.keystore`.

## Deterministic controls
- `scripts/scan_secrets.py` — secret scanner (PreToolUse-style + CI).
- Claude PreToolUse hook `hooks/block_secret_exposure.py` blocks reads/writes of
  protected paths and blocks commands that would print secret values.
- Codex equivalent: `scripts/scan_secrets.py` invoked as a task gate and in CI.

## Log sanitization
All logs, plans, examples, and reports must be run through redaction. Never place
actual secret values anywhere. Use environment-variable names and templates only.
