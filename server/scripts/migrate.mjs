// Thin wrapper around node-pg-migrate so migrations run with the same
// zero-config defaults as the server itself (no .env required).
import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import runner from 'node-pg-migrate';

const here = path.dirname(fileURLToPath(import.meta.url));
const direction = process.argv[2] === 'down' ? 'down' : 'up';

const databaseUrl =
  process.env.DATABASE_URL ?? 'postgres://verdant:verdant@localhost:5432/verdant';

try {
  const applied = await runner({
    databaseUrl,
    dir: path.join(here, '..', 'migrations'),
    migrationsTable: 'pgmigrations',
    direction,
    count: direction === 'down' ? 1 : Infinity,
  });

  if (applied.length === 0) {
    console.log('Database already up to date.');
  } else {
    console.log(`Migrated ${direction}:`, applied.map((m) => m.name).join(', '));
  }
  process.exit(0);
} catch (err) {
  console.error('Migration failed:', err.message);
  console.error('Is Postgres running? Try: docker compose up -d');
  process.exit(1);
}
