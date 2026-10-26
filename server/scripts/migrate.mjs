// Applies Drizzle migrations. If the database was created with node-pg-migrate,
// existing tables are detected and pending baseline migrations are marked as
// applied without re-running CREATE TABLE statements (data is preserved).
import 'dotenv/config';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { readMigrationFiles } from 'drizzle-orm/migrator';

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.join(here, '..', 'drizzle');

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('[migrate] ERROR: DATABASE_URL is not set.');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: databaseUrl });
const db = drizzle(pool);

async function tableExists(client, name) {
  const result = await client.query(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = $1`,
    [name]
  );
  return result.rowCount > 0;
}

async function drizzleMigrationsApplied(client) {
  if (!(await tableExists(client, '__drizzle_migrations'))) return false;
  const result = await client.query(
    'SELECT COUNT(*)::int AS count FROM "__drizzle_migrations"'
  );
  return result.rows[0].count > 0;
}

async function baselineExistingDatabase(client) {
  const migrations = readMigrationFiles({ migrationsFolder });
  if (migrations.length === 0) return;

  await client.query(`
    CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `);

  for (const migration of migrations) {
    const hash = crypto
      .createHash('sha256')
      .update(migration.sql)
      .digest('hex');

    const existing = await client.query(
      'SELECT 1 FROM "__drizzle_migrations" WHERE hash = $1',
      [hash]
    );
    if (existing.rowCount === 0) {
      await client.query(
        'INSERT INTO "__drizzle_migrations" (hash, created_at) VALUES ($1, $2)',
        [hash, migration.folderMillis]
      );
      console.log(
        `[migrate] Baseline: marked ${migration.hash ?? 'migration'} as applied (existing schema).`
      );
    }
  }
}

try {
  const client = await pool.connect();
  try {
    const hasUsers = await tableExists(client, 'users');
    const hasDrizzleHistory = await drizzleMigrationsApplied(client);

    if (hasUsers && !hasDrizzleHistory) {
      console.log(
        '[migrate] Existing tables found — baselining without altering data.'
      );
      await baselineExistingDatabase(client);
    }
  } finally {
    client.release();
  }

  console.log('[migrate] Applying pending Drizzle migrations...');
  await migrate(db, { migrationsFolder });
  console.log('[migrate] Database is up to date.');
  process.exit(0);
} catch (err) {
  console.error('[migrate] FAILED:', err.message);
  if (err.cause) console.error('[migrate] Cause:', err.cause);
  console.error(
    '[migrate] Is Postgres running? Check DATABASE_URL and connectivity.'
  );
  process.exit(1);
} finally {
  await pool.end();
}
