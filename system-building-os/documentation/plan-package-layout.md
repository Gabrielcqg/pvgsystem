# Codex Plan Package Layout

`/plan_max` assembles an implementation-ready package under
`plans/active/<project-slug>/`. The numbering may be improved but every concept
is preserved. Machine-readable artifacts (`.yaml`/`.json`) must validate against
`system-building-os/schemas/`.

```
plans/active/<project-slug>/
├── PLAN_METADATA.yaml            # schema: plan-metadata
├── EXECUTION.lock                # from contracts/execution-lock.template.yaml
├── 00-repository-context.md
├── 00-repository-context.json
├── 01-user-intent.json           # schema: user-intent  (+ 01-user-intent.md)
├── 02-clarifying-questions.md
├── 03-assumption-ledger.md       # schema: assumption-ledger (mirror .json optional)
├── 04-decision-ledger.md         # schema: decision-ledger
├── 05-product-system-plan.md
├── 06-technical-architecture.md
├── 07-data-architecture.md       # + data-model.yaml (schema: data-model)
├── 08-auth-security-plan.md
├── 09-frontend-uiux-plan.md
├── 10-backend-api-plan.md
├── 11-ai-plan.md
├── 12-integration-mcp-plan.md
├── 13-infrastructure-environment-plan.md
├── 14-observability-plan.md
├── 15-performance-plan.md
├── 16-test-validation-plan.md
├── 17-release-rollback-plan.md
├── 18-task-manifest.yaml         # schema: task-manifest
├── 19-dependency-graph.yaml
├── 20-agent-map.yaml             # schema: agent-map
├── 21-skill-map.yaml             # schema: skill-map
├── 22-file-ownership.yaml        # schema: file-ownership
├── 23-context-packets/           # one focused packet per task
├── 24-api-contracts/             # schema: api-contract (per endpoint)
├── 25-data-contracts/            # schema: data-model / json schemas
├── 26-acceptance-criteria.yaml   # schema: acceptance-criteria
├── 27-requirement-traceability.yaml  # schema: traceability
├── 28-codex-handoff.md
├── 29-codex-start.md
├── 30-plan-validation-report.md
└── runtime/                      # state.json, execution-ledger.jsonl, task-status.yaml,
                                  # checkpoints/, phase-logs/, deviations.jsonl
```

Validate a package with:
```
python3 scripts/validate_plan_package.py plans/active/<project-slug>
```
