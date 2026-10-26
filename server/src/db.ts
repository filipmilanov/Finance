import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { config } from './config.js';
import * as schema from './db/schema.js';

// Return NUMERIC as a JS number instead of a string. Safe here: amounts are
// numeric(14,2) and stay well inside the float53 exact-integer-cents range.
pg.types.setTypeParser(1700, (value) => Number(value));

export const pool = new pg.Pool({ connectionString: config.databaseUrl });

export const db = drizzle(pool, { schema });
