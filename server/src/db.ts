import pg from 'pg';
import { config } from './config.js';

// Do not force a TLS policy here. Render's internal Postgres URL is private and
// does not require TLS; Render's external URL carries sslmode=require when TLS
// is required. Let node-postgres honor the connection URL instead of forcing
// certificate verification against Render's managed/self-signed chain.
export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  max: 20,
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
