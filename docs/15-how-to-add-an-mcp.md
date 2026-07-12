# How to Add an MCP
Add an entry to `system-building-os/registries/mcp-registry.yaml` with all
governed fields (least privilege, read/write separation, env-var auth reference,
fallback). Add access grants per environment in `mcp-profiles.yaml`. Validate
with `python3 scripts/validate_artifact.py mcp-registry ...`. Never enable an MCP
globally or put a secret value in config.
