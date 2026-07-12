# Database (migration-based source of truth)

The database is represented in the repository, never only by an MCP connection.
See `system-building-os/policies/database-policy.md`. The concrete schema and
migrations are produced per project by the `database-migration-builder`.

| Directory       | Purpose                                             |
|-----------------|-----------------------------------------------------|
| `schema/`       | Declarative canonical schema definitions            |
| `migrations/`   | Ordered, reversible migrations (forward + rollback) |
| `seeds/`        | Synthetic seed data only                            |
| `policies/`     | Row-level security / tenant isolation policies      |
| `fixtures/`     | Synthetic test fixtures                             |
| `tests/`        | Database + migration + drift tests                  |
| `documentation/`| ERDs, data dictionary, backup/restore runbook       |

Rules (enforced by policy + completion gates): all schema changes via migrations;
local/test isolated from production; test data synthetic; rollback + drift check
required; database tests are part of the completion gates.
