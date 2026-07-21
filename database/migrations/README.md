# database/migrations

Ordered, reversible migrations. Each has a forward and rollback path.

Populated per project by the `database-migration-builder`. Empty in the factory (this repo is not a product).

For the current Pavageau backend product, do not add SQL here. Use
`supabase/migrations/` as the only versioned migration source.
