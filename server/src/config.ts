import 'dotenv/config';

/** Treats a blank env var as absent — an exported-but-empty PORT should not win. */
function env(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim() !== '' ? value.trim() : fallback;
}

/**
 * Some shells export PORT=0 (meaning "pick any free port"), which would make
 * the Vite proxy's fixed :4000 target miss. Only a real port number is honoured.
 */
function port(fallback: number): number {
  const value = Number(env('PORT', String(fallback)));
  return Number.isInteger(value) && value > 0 && value < 65536 ? value : fallback;
}

/**
 * Everything has a working default that matches docker-compose.yml, so the
 * server runs with no .env at all. Create server/.env to override any of these.
 */
export const config = {
  databaseUrl: env('DATABASE_URL', 'postgres://verdant:verdant@localhost:5432/verdant'),
  jwtSecret: env('JWT_SECRET', 'verdant-dev-secret-change-in-production'),
  port: port(4000),
  clientOrigin: env('CLIENT_ORIGIN', 'http://localhost:5173'),
};
