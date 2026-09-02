import { Buffer } from 'node:buffer';

export type FeedCursor = { createdAt: string; id: string };

export function encodeFeedCursor(cursor: FeedCursor): string {
  if (!cursor.id || !cursor.createdAt) throw new Error('Invalid feed cursor');
  const parsed = Date.parse(cursor.createdAt);
  if (!Number.isFinite(parsed)) throw new Error('Invalid feed cursor timestamp');
  return Buffer.from(JSON.stringify({ createdAt: new Date(parsed).toISOString(), id: cursor.id }), 'utf8').toString('base64url');
}

export function decodeFeedCursor(value: string): FeedCursor {
  if (!value || value.length > 512) throw new Error('Invalid feed cursor');
  let parsed: unknown;
  try { parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')); } catch { throw new Error('Invalid feed cursor'); }
  if (!parsed || typeof parsed !== 'object') throw new Error('Invalid feed cursor');
  const cursor = parsed as { createdAt?: unknown; id?: unknown };
  if (typeof cursor.createdAt !== 'string' || typeof cursor.id !== 'string' || !cursor.id) throw new Error('Invalid feed cursor');
  const timestamp = Date.parse(cursor.createdAt);
  if (!Number.isFinite(timestamp)) throw new Error('Invalid feed cursor timestamp');
  return { createdAt: new Date(timestamp).toISOString(), id: cursor.id };
}
