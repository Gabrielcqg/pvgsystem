# Rule: Secret Safety (Claude)
- Never read, print, or commit secrets. Use env-var names and `.env.example` only.
- Protected paths and secret values are blocked by the PreToolUse hook
  `.claude/hooks/block_secret_exposure.py` (delegates to `scripts/scan_secrets.py`).
Canonical: `system-building-os/policies/secret-policy.md`.
