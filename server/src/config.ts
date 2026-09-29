import 'dotenv/config';

/** Treats a blank env var as absent — an exported-but-empty PORT should not win. */
function env(name: string): string {
  const value = process.env[name];
  if (value === undefined) {
    console.warn(`Warning: Environment variable ${name} is not set.`);
    return '';
  } else if (value.trim() === '') {
    console.warn(`Warning: Environment variable ${name} is set but empty.`);
    return '';
  }
  return value.trim();
}

/**
 * Some shells export PORT=0 (meaning "pick any free port"), which would make
 * the Vite proxy's fixed :4000 target miss. Only a real port number is honoured.
 */
function port(fallback: number): number {
  const value = Number(env('PORT')) ?? fallback;
  return Number.isInteger(value) && value > 0 && value < 65536
    ? value
    : fallback;
}

/**
 * Everything has a working default that matches docker-compose.yml, so the
 * server runs with no .env at all. Create server/.env to override any of these.
 */
export const config = {
  databaseUrl: env('DATABASE_URL'),
  jwtSecret: env('JWT_SECRET'),
  port: port(4000),
  clientOrigin: env('CLIENT_ORIGIN'),
};
