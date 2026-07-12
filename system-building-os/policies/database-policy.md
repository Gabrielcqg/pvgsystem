# Database Operating Policy

The OS plans and implements databases autonomously. A database must never be
represented only by an MCP connection. The source of truth stays in repository
artifacts.

```
database/
├── schema/          # canonical schema definitions (declarative)
├── migrations/      # ordered, reversible migrations
├── seeds/           # synthetic seed data only
├── policies/        # row-level security / isolation policies
├── fixtures/        # synthetic test fixtures
├── tests/           # database + migration tests
└── documentation/   # ERDs, data dictionary, backup/restore runbook
```

## Rules
- All schema changes use migrations. No out-of-band schema edits.
- Local and test databases are isolated from each other and from production.
- Development migrations may be created and applied autonomously.
- Test data must be synthetic. Production data is never copied into logs/fixtures.
- Migration rollback must be considered for every migration.
- Schema drift must be checked (`scripts/check_schema_drift.py` contract).
- Constraints must be explicit; indexes must map to real query needs.
- Destructive data changes require a safe transition plan (expand-and-contract).
- Multi-tenant data requires explicit isolation; row-level policies must be
  tested when used.
- Backup and restore strategy must be documented.
- Database tests are part of the completion gates
  (`database_tests_passed`, `migration_validation_passed`).

## Selection
The database is selected from requirements — relational, document, key-value,
graph, or vector — not forced uniformly. Sensible defaults per project profile
are allowed (see `capabilities/database.md`), but requirements win.
