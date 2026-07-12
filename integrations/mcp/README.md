# MCP Integration Templates

MCP configuration is **generated per project** by the `integration-mcp-architect`
from the governed registry — never enabled globally. These are safe templates
with **no secret values** (auth by env-var reference only).

- Registry (single source of truth): `system-building-os/registries/mcp-registry.yaml`
- Access profiles (least privilege, per env + runtime): `system-building-os/registries/mcp-profiles.yaml`
- Governance policy: `system-building-os/policies/mcp-governance.md`

## Files here
- `claude.mcp.json.template` — Claude `.mcp.json` shape (copy + fill selected servers).
- `codex.mcp.toml.template` — Codex `config.toml` `[mcp_servers.*]` shape.
- `health-check.py` — verifies referenced env-var **names** are set (never prints values) and prints the fallback per MCP.

Database schemas, migrations, and integration contracts always remain in Git;
an MCP is never the only source of truth, and every MCP has a local fallback.
