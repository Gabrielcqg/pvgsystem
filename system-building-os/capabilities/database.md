# Database capability

Plan and implement relational/document/key-value/graph/vector storage.

## Owning agents
- data-architect (planning)
- database-migration-builder (implementation)

## Skills
- `data-architecture-planning`
- `database-selection`
- `migration-planning`
- `database-schema-implementation`
- `database-migration-implementation`
- `database-test-and-drift-check`

## Plan templates
- `templates/07-data-architecture-plan.md`
- `templates/08-database-migration-plan.md`

## Notes

Source of truth is `database/` (schema, migrations, seeds, policies, fixtures, tests, documentation). See policies/database-policy.md. Default profiles: PostgreSQL for relational SaaS, SQLite for local/tests, add a vector store only when retrieval is required.
