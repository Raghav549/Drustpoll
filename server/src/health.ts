import { query } from './db.js';

export async function health() {
  await query('SELECT 1');
  return { ok: true, service: 'drustpoll-auth', database: 'ok' } as const;
}
