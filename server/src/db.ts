import pg from 'pg';
import { config } from './config.js';

// Render's managed Postgres certificate chain is not trusted by Node's default
// CA store. Keep TLS enabled in production, while allowing the deployment to
// opt into strict CA verification when a trusted CA is explicitly configured.
const productionSsl = process.env.NODE_ENV === 'production'
  ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'true' }
  : undefined;

export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  max: 20,
  ssl: productionSsl,
});

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(text: string, values: unknown[] = []): Promise<pg.QueryResult<T>> {
  return pool.query<T>(text, values);
}

export async function withTransaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
