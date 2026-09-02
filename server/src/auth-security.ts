import { createHash, randomBytes } from 'node:crypto';

export function hashOpaqueSecret(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

export function createOpaqueSecret(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

export function timingSafeStringEqual(a: string, b: string): boolean {
  const ah = createHash('sha256').update(a, 'utf8').digest();
  const bh = createHash('sha256').update(b, 'utf8').digest();
  return ah.length === bh.length && ah.every((v, i) => v === bh[i]);
}

export function normalizeIdentifier(value: string): string {
  return value.trim().toLowerCase();
}
