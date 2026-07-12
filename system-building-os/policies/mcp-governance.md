# MCP Governance Policy

MCPs are selected automatically per project need but governed by least privilege.
MCP configuration is never the only source of truth — schemas, migrations, and
integration contracts remain in Git.

## The MCP governor must
- activate only necessary MCPs (never enable everything globally);
- use least privilege;
- reference secrets by environment-variable name only;
- separate read and write capabilities;
- separate local, development, staging, and production;
- create tool allowlists where possible;
- block unnecessary destructive tools;
- create health checks;
- create mocks or fallbacks;
- generate Claude and Codex configurations separately;
- never make MCP configuration a single point of truth.

## Registry entry (canonical fields)
Each MCP is recorded in `registries/mcp-registry.yaml` with:
`id, name, category, provider, official_or_trusted_source, purpose,
required_for_project, runtime{claude,codex}, allowed_agents, allowed_environments,
transport, authentication_reference, access_mode, enabled_tools, disabled_tools,
write_capabilities, data_classification, cost_risk, security_risk, audit_required,
health_check, fallback`.

## Access profiles
Defined in `registries/mcp-profiles.yaml`: which MCPs/tools are permitted per
environment and per runtime, with read-only defaults and explicit write grants.
Every essential capability has a local fallback so no MCP is a single point of
failure.
