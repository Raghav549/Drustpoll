import { randomInt } from 'node:crypto';
import { durations, config } from './config.js';
import { query, withTransaction } from './db.js';
import { fingerprint, hashPassword, normalizeEmail, normalizePhone, normalizeUsername, randomToken, tokenHash, validatePassword, verifyPassword } from './crypto.js';
import { consumeLimit } from './rate-limit.js';

export type SignupInput = { username: string; displayName: string; password: string; email?: string; phone?: string; devicePublicKey?: string };
export type LoginInput = { identifier: string; password: string; devicePublicKey?: string };

function cleanSignup(input: SignupInput) {
  const username = normalizeUsername(input.username);
  const displayName = input.displayName.trim();
  const email = input.email ? normalizeEmail(input.email) : undefined;
  const phone = input.phone ? normalizePhone(input.phone) : undefined;
  if (!/^[a-z0-9_]{3,30}$/.test(username)) throw new Error('Invalid username');
  if (!displayName || displayName.length > 80) throw new Error('Invalid display name');
  if (!email && !phone) throw new Error('Email or phone is required');
  const passwordError = validatePassword(input.password);
  if (passwordError) throw new Error(passwordError);
  return { username, displayName, email, phone };
}

async function audit(userId: string | null, eventType: string, success: boolean, metadata: Record<string, unknown> = {}) {
  await query('INSERT INTO security_events(user_id,event_type,success,metadata) VALUES($1,$2,$3,$4)', [userId, eventType, success, JSON.stringify(metadata)]);
}

export async function signup(input: SignupInput, ipKey: string) {
  if (!consumeLimit(`signup:${ipKey}`, 8, 60 * 60 * 1000)) throw new Error('Too many signup attempts');
  const data = cleanSignup(input);
  const passwordHash = await hashPassword(input.password);
  try {
    return await withTransaction(async client => {
      const existing = await client.query('SELECT 1 FROM users WHERE lower(username)=lower($1) OR ($2::text IS NOT NULL AND lower(email)=lower($2)) OR ($3::text IS NOT NULL AND phone=$3) LIMIT 1', [data.username, data.email ?? null, data.phone ?? null]);
      if (existing.rowCount) throw new Error('Account identifier already in use');
      const user = await client.query<{ id: string }>('INSERT INTO users(username,display_name,email,phone) VALUES($1,$2,$3,$4) RETURNING id', [data.username, data.displayName, data.email ?? null, data.phone ?? null]);
      const userId = user.rows[0].id;
      await client.query('INSERT INTO password_credentials(user_id,password_hash) VALUES($1,$2)', [userId, passwordHash]);
      await audit(userId, 'signup_completed', true);
      return createSession(userId, input.devicePublicKey ?? '', ipKey, 'signup');
    });
  } catch (error) {
    throw error;
  }
}

export async function login(input: LoginInput, ipKey: string) {
  if (!consumeLimit(`login:${ipKey}`, 20, 15 * 60 * 1000)) throw new Error('Too many login attempts');
  const identifier = input.identifier.trim().toLowerCase();
  const result = await query<{ id: string; status: string; password_hash: string }>('SELECT u.id,u.status,p.password_hash FROM users u JOIN password_credentials p ON p.user_id=u.id WHERE lower(u.username)=lower($1) OR lower(u.email)=lower($1) OR u.phone=$1 LIMIT 1', [identifier]);
  const row = result.rows[0];
  const valid = row ? await verifyPassword(row.password_hash, input.password) : false;
  if (!row || !valid || row.status !== 'active') {
    await audit(row?.id ?? null, 'login_failed', false);
    throw new Error('Invalid credentials');
  }
  await audit(row.id, 'login_succeeded', true);
  return createSession(row.id, input.devicePublicKey ?? '', ipKey, 'login');
}

async function createSession(userId: string, devicePublicKey: string, ipKey: string, reason: string) {
  const raw = randomToken(32);
  const now = Date.now();
  const expires = new Date(now + durations.sessionMs);
  const absolute = new Date(now + durations.absoluteSessionMs);
  const result = await query<{ id: string; device_id: string }>('WITH d AS (INSERT INTO devices(user_id,public_key) VALUES($1,$2) RETURNING id) INSERT INTO sessions(user_id,device_id,token_hash,expires_at,absolute_expires_at,ip_hash) SELECT $1,d.id,$3,$4,$5,$6 FROM d RETURNING id,device_id', [userId, devicePublicKey || null, tokenHash(raw), expires, absolute, fingerprint(ipKey)]);
  await audit(userId, 'session_created', true, { reason });
  return { sessionId: result.rows[0].id, deviceId: result.rows[0].device_id, userId, token: raw, expiresAt: expires.toISOString() };
}

export async function authenticate(rawToken: string) {
  if (!rawToken) return null;
  const result = await query<{ session_id: string; user_id: string; device_id: string; expires_at: Date; absolute_expires_at: Date }>('SELECT id AS session_id,user_id,device_id,expires_at,absolute_expires_at FROM sessions WHERE token_hash=$1 AND revoked_at IS NULL AND expires_at>now() AND absolute_expires_at>now() LIMIT 1', [tokenHash(rawToken)]);
  const row = result.rows[0];
  if (!row) return null;
  await query('UPDATE sessions SET last_seen_at=now() WHERE id=$1', [row.session_id]);
  return { sessionId: row.session_id, userId: row.user_id, deviceId: row.device_id, expiresAt: row.expires_at };
}

export async function revoke(rawToken: string) {
  const auth = await authenticate(rawToken);
  if (!auth) return;
  await query('UPDATE sessions SET revoked_at=now() WHERE id=$1', [auth.sessionId]);
  await audit(auth.userId, 'session_revoked', true);
}

export async function revokeAll(userId: string) {
  await query('UPDATE sessions SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL', [userId]);
  await audit(userId, 'all_sessions_revoked', true);
}

export async function requestOtp(userId: string | null, destination: string, purpose: 'verify_email'|'verify_phone'|'login_step_up'|'password_reset', ipKey: string) {
  if (!consumeLimit(`otp:${ipKey}:${destination.slice(-6)}`, 5, 15 * 60 * 1000)) throw new Error('Too many OTP requests');
  const code = String(randomInt(100000, 1000000));
  const expires = new Date(Date.now() + 5 * 60 * 1000);
  await query('INSERT INTO otp_challenges(user_id,purpose,destination_fingerprint,code_hash,expires_at) VALUES($1,$2,$3,$4,$5)', [userId, purpose, fingerprint(destination), fingerprint(`${purpose}:${destination}:${code}`), expires]);
  // Delivery is deliberately outside account authority: plug in email/SMS transport here.
  // Never return the code from this API.
  await audit(userId, 'otp_requested', true, { purpose });
  return { expiresAt: expires.toISOString() };
}

export async function verifyOtp(userId: string | null, destination: string, purpose: string, code: string) {
  if (!/^\d{6}$/.test(code)) throw new Error('Invalid OTP');
  const result = await query<{ id: string; user_id: string | null; attempts: number }>('SELECT id,user_id,attempts FROM otp_challenges WHERE user_id IS NOT DISTINCT FROM $1 AND purpose=$2 AND destination_fingerprint=$3 AND consumed_at IS NULL AND expires_at>now() ORDER BY created_at DESC LIMIT 1', [userId, purpose, fingerprint(destination)]);
  const row = result.rows[0];
  if (!row || row.attempts >= 5) throw new Error('Invalid or expired OTP');
  const expected = fingerprint(`${purpose}:${destination}:${code}`);
  const matches = await query<{ ok: boolean }>('SELECT code_hash=$1 AS ok FROM otp_challenges WHERE id=$2', [expected, row.id]);
  if (!matches.rows[0]?.ok) {
    await query('UPDATE otp_challenges SET attempts=attempts+1 WHERE id=$1', [row.id]);
    throw new Error('Invalid or expired OTP');
  }
  await query('UPDATE otp_challenges SET consumed_at=now() WHERE id=$1', [row.id]);
  await audit(userId, 'otp_verified', true, { purpose });
  return true;
}

export async function changePassword(userId: string, oldPassword: string, newPassword: string) {
  const passwordError = validatePassword(newPassword);
  if (passwordError) throw new Error(passwordError);
  const result = await query<{ password_hash: string }>('SELECT password_hash FROM password_credentials WHERE user_id=$1', [userId]);
  if (!result.rows[0] || !(await verifyPassword(result.rows[0].password_hash, oldPassword))) throw new Error('Current password is incorrect');
  await query('UPDATE password_credentials SET password_hash=$2,changed_at=now() WHERE user_id=$1', [userId, await hashPassword(newPassword)]);
  await revokeAll(userId);
  await audit(userId, 'password_changed', true);
}
