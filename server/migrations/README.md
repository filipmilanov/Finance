# Legacy migrations (node-pg-migrate)

The `230926_add_initial_tables.js` file was used by **node-pg-migrate** before the
project switched to **Drizzle ORM**.

New schema changes go in `server/drizzle/` via:

```bash
cd server
npm run db:generate   # after editing src/db/schema.ts
npm run db:migrate    # apply to the database
```

If your database was created with the old migrator, `db:migrate` detects existing
tables and baselines Drizzle without re-creating them.
