// Applies Drizzle migrations. If the database was created with node-pg-migrate,
// existing tables are detected and pending baseline migrations are marked as
// applied without re-running CREATE TABLE statements (data is preserved).
import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { readMigrationFiles } from 'drizzle-orm/migrator';

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.join(here, '..', 'drizzle');

const MIGRATIONS_SCHEMA = 'drizzle';
const MIGRATIONS_TABLE = '__drizzle_migrations';

function normalizeDatabaseUrl(raw) {
  if (!raw) return '';
  let url = raw.trim();
  if (
    (url.startsWith('"') && url.endsWith('"')) ||
    (url.startsWith("'") && url.endsWith("'"))
  ) {
    url = url.slice(1, -1).trim();
  }
  return url;
}

const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL);
if (!databaseUrl) {
  console.error('[migrate] ERROR: DATABASE_URL is not set.');
  process.exit(1);
}

if (!/^postgres(ql)?:\/\//i.test(databaseUrl)) {
  console.error(
    '[migrate] ERROR: DATABASE_URL must start with postgresql:// (or postgres://).'
  );
  process.exit(1);
}

let pool;
try {
  pool = new pg.Pool({ connectionString: databaseUrl });
} catch (err) {
  console.error('[migrate] ERROR: Invalid DATABASE_URL —', err.message);
  console.error(
    '[migrate] Check for quotes, spaces, or special characters in the password (URL-encode them).'
  );
  process.exit(1);
}
const db = drizzle(pool);

async function tableExists(client, schema, name) {
  const result = await client.query(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = $1 AND table_name = $2`,
    [schema, name]
  );
  return result.rowCount > 0;
}

async function drizzleMigrationsApplied(client) {
  if (!(await tableExists(client, MIGRATIONS_SCHEMA, MIGRATIONS_TABLE))) {
    return false;
  }
  const result = await client.query(
    `SELECT COUNT(*)::int AS count FROM ${MIGRATIONS_SCHEMA}."${MIGRATIONS_TABLE}"`
  );
  return result.rows[0].count > 0;
}

async function baselineExistingDatabase(client) {
  const migrations = readMigrationFiles({ migrationsFolder });
  if (migrations.length === 0) return;

  await client.query(`CREATE SCHEMA IF NOT EXISTS ${MIGRATIONS_SCHEMA}`);
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_SCHEMA}."${MIGRATIONS_TABLE}" (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `);

  for (const migration of migrations) {
    const hash = migration.hash;

    const existing = await client.query(
      `SELECT 1 FROM ${MIGRATIONS_SCHEMA}."${MIGRATIONS_TABLE}" WHERE hash = $1`,
      [hash]
    );
    if (existing.rowCount === 0) {
      await client.query(
        `INSERT INTO ${MIGRATIONS_SCHEMA}."${MIGRATIONS_TABLE}" (hash, created_at) VALUES ($1, $2)`,
        [hash, migration.folderMillis]
      );
      console.log(
        `[migrate] Baseline: marked ${migration.hash.slice(0, 8)}… as applied (existing schema).`
      );
    }
  }
}

try {
  const client = await pool.connect();
  try {
    const hasUsers = await tableExists(client, 'public', 'users');
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
