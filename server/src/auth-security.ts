import { createHash, randomBytes, timingSafeEqual, createHmac } from 'node:crypto';
import { config } from './config.js';

export function hashOpaqueSecret(value: string): Buffer {
  return createHmac('sha256', config.sessionSecret).update(value, 'utf8').digest();
}

export function createOpaqueSecret(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

export function timingSafeStringEqual(a: string, b: string): boolean {
  const ah = createHash('sha256').update(a, 'utf8').digest();
  const bh = createHash('sha256').update(b, 'utf8').digest();
  return timingSafeEqual(ah, bh);
}

export function normalizeIdentifier(value: string): string {
  return value.trim().toLowerCase();
}

export function otpHash(challengeId: string, purpose: string, destination: string, code: string): Buffer {
  return createHmac('sha256', config.sessionSecret)
    .update(`${challengeId}|${purpose}|${destination}|${code}`, 'utf8')
    .digest();
}

export function hashIp(value: string): Buffer {
  return createHash('sha256').update(value, 'utf8').digest();
}
