# How to Configure a Database
The database is selected from requirements by the `data-architect` (not forced).
Schema + migrations live in `database/`. Local/test databases are isolated; dev
migrations run autonomously; test data is synthetic. See
`policies/database-policy.md`. Database + migration + drift tests are completion
gates when a database exists.
