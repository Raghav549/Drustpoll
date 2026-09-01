import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import argon2 from 'argon2';
import { config } from './config.js';

export async function hashPassword(password: string): Promise<string> {
  const peppered = createHmac('sha256', config.passwordPepper).update(password, 'utf8').digest('base64url');
  return argon2.hash(peppered, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  const peppered = createHmac('sha256', config.passwordPepper).update(password, 'utf8').digest('base64url');
  try { return await argon2.verify(hash, peppered, { type: argon2.argon2id }); }
  catch { return false; }
}

export function randomToken(bytes = 32): string { return randomBytes(bytes).toString('base64url'); }
export function tokenHash(token: string): Buffer { return createHmac('sha256', config.sessionSecret).update(token).digest(); }
export function fingerprint(value: string): Buffer { return createHash('sha256').update(value, 'utf8').digest(); }
export function equalSecret(a: Buffer, b: Buffer): boolean { return a.length === b.length && timingSafeEqual(a, b); }
export function normalizeEmail(value: string): string { return value.trim().toLowerCase(); }
export function normalizeUsername(value: string): string { return value.trim().toLowerCase(); }
export function normalizePhone(value: string): string { return value.replace(/[\s()-]/g, ''); }

export function validatePassword(password: string): string | null {
  if (password.length < 12) return 'Password must be at least 12 characters.';
  if (password.length > 128) return 'Password is too long.';
  return null;
}
