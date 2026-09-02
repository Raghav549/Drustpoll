import { randomInt, randomUUID } from 'node:crypto';
import { durations } from './config.js';
import { query, withTransaction } from './db.js';
import { normalizeEmail, normalizePhone, normalizeUsername, randomToken, tokenHash, validatePassword, verifyPassword, hashPassword } from './crypto.js';
import { consumeLimit } from './rate-limit.js';
import { hashIp, otpHash } from './auth-security.js';

export type SignupInput = { username: string; displayName: string; password: string; email?: string; phone?: string; devicePublicKey?: string; deviceLabel?: string };
export type LoginInput = { identifier: string; password: string; devicePublicKey?: string; deviceLabel?: string };
export type OtpPurpose = 'verify_email'|'verify_phone'|'login_step_up'|'password_reset';

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

async function audit(userId: string | null, eventType: string, success: boolean, ipKey?: string, metadata: Record<string, unknown> = {}) {
  await query(
    'INSERT INTO security_events(user_id,event_type,success,ip_hash,metadata) VALUES($1,$2,$3,$4,$5)',
    [userId, eventType, success, ipKey ? hashIp(ipKey) : null, JSON.stringify(metadata)],
  );
}

async function upsertDevice(userId: string, devicePublicKey: string, label?: string) {
  const key = devicePublicKey.trim() || null;
  if (!key) {
    const result = await query<{ id: string }>('INSERT INTO devices(user_id,label) VALUES($1,$2) RETURNING id', [userId, label?.trim().slice(0, 80) || null]);
    return result.rows[0].id;
  }
  const result = await query<{ id: string }>(
    `INSERT INTO devices(user_id,public_key,label,device_key_fingerprint)
     VALUES($1,$2,$3,digest($2,'sha256'))
     ON CONFLICT (user_id,device_key_fingerprint) WHERE revoked_at IS NULL
     DO UPDATE SET public_key=EXCLUDED.public_key,label=COALESCE(EXCLUDED.label,devices.label),revoked_at=NULL
     RETURNING id`,
    [userId, key, label?.trim().slice(0, 80) || null],
  );
  return result.rows[0].id;
}

async function createSession(userId: string, devicePublicKey: string, deviceLabel: string | undefined, ipKey: string, reason: string) {
  const accessToken = randomToken(32);
  const refreshToken = randomToken(48);
  const now = Date.now();
  const expires = new Date(now + 30 * 60_000);
  const refreshExpires = new Date(now + durations.sessionMs);
  const absolute = new Date(now + durations.absoluteSessionMs);
  const familyId = randomUUID();
  const deviceId = await upsertDevice(userId, devicePublicKey, deviceLabel);
  const result = await query<{ id: string; device_id: string }>(
    `INSERT INTO sessions(user_id,device_id,token_hash,expires_at,absolute_expires_at,ip_hash,family_id,refresh_token_hash,refresh_expires_at)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id,device_id`,
    [userId, deviceId, tokenHash(accessToken), expires, absolute, hashIp(ipKey), familyId, tokenHash(refreshToken), refreshExpires],
  );
  await audit(userId, 'session_created', true, ipKey, { reason });
  return { sessionId: result.rows[0].id, deviceId, userId, token: accessToken, refreshToken, expiresAt: expires.toISOString(), refreshExpiresAt: refreshExpires.toISOString(), absoluteExpiresAt: absolute.toISOString() };
}

export async function signup(input: SignupInput, ipKey: string) {
  if (!consumeLimit(`signup:${ipKey}`, 8, 60 * 60 * 1000)) throw new Error('Too many signup attempts');
  const data = cleanSignup(input);
  const passwordHash = await hashPassword(input.password);
  return withTransaction(async client => {
    const existing = await client.query('SELECT 1 FROM users WHERE lower(username)=lower($1) OR ($2::text IS NOT NULL AND lower(email)=lower($2)) OR ($3::text IS NOT NULL AND phone=$3) LIMIT 1', [data.username, data.email ?? null, data.phone ?? null]);
    if (existing.rowCount) throw new Error('Account identifier already in use');
    const user = await client.query<{ id: string }>('INSERT INTO users(username,display_name,email,phone) VALUES($1,$2,$3,$4) RETURNING id', [data.username, data.displayName, data.email ?? null, data.phone ?? null]);
    const userId = user.rows[0].id;
    await client.query('INSERT INTO password_credentials(user_id,password_hash) VALUES($1,$2)', [userId, passwordHash]);
    await client.query('INSERT INTO profiles(user_id) VALUES($1) ON CONFLICT DO NOTHING', [userId]).catch(() => undefined);
    return createSession(userId, input.devicePublicKey ?? '', input.deviceLabel, ipKey, 'signup');
  });
}

export async function login(input: LoginInput, ipKey: string) {
  if (!consumeLimit(`login:${ipKey}`, 20, 15 * 60 * 1000)) throw new Error('Too many login attempts');
  const identifier = input.identifier.trim().toLowerCase();
  const result = await query<{ id: string; status: string; password_hash: string }>('SELECT u.id,u.status,p.password_hash FROM users u JOIN password_credentials p ON p.user_id=u.id WHERE lower(u.username)=lower($1) OR lower(u.email)=lower($1) OR u.phone=$1 LIMIT 1', [identifier]);
  const row = result.rows[0];
  const valid = row ? await verifyPassword(row.password_hash, input.password) : false;
  if (!row || !valid || row.status !== 'active') {
    await audit(row?.id ?? null, 'login_failed', false, ipKey);
    throw new Error('Invalid credentials');
  }
  await audit(row.id, 'login_succeeded', true, ipKey);
  return createSession(row.id, input.devicePublicKey ?? '', input.deviceLabel, ipKey, 'login');
}

export async function authenticate(rawToken: string) {
  if (!rawToken) return null;
  const result = await query<{ session_id: string; user_id: string; device_id: string; expires_at: Date; absolute_expires_at: Date }>(
    'SELECT id AS session_id,user_id,device_id,expires_at,absolute_expires_at FROM sessions WHERE token_hash=$1 AND revoked_at IS NULL AND expires_at>now() AND absolute_expires_at>now() LIMIT 1',
    [tokenHash(rawToken)],
  );
  const row = result.rows[0];
  if (!row) return null;
  await query('UPDATE sessions SET last_seen_at=now() WHERE id=$1', [row.session_id]);
  return { sessionId: row.session_id, userId: row.user_id, deviceId: row.device_id, expiresAt: row.expires_at, absoluteExpiresAt: row.absolute_expires_at };
}

export async function refresh(rawRefreshToken: string, ipKey: string) {
  if (!rawRefreshToken) throw new Error('Invalid session');
  const result = await query<{ session_id: string; user_id: string; device_id: string; family_id: string; expires_at: Date; absolute_expires_at: Date }>(
    `SELECT id AS session_id,user_id,device_id,family_id,expires_at,absolute_expires_at
     FROM sessions
     WHERE refresh_token_hash=$1 AND revoked_at IS NULL AND refresh_expires_at>now() AND absolute_expires_at>now()
     LIMIT 1`,
    [tokenHash(rawRefreshToken)],
  );
  const row = result.rows[0];
  if (!row) {
    const family = await query<{ family_id: string }>('SELECT family_id FROM sessions WHERE refresh_token_hash=$1 LIMIT 1', [tokenHash(rawRefreshToken)]);
    if (family.rows[0]?.family_id) {
      await query('UPDATE sessions SET revoked_at=now(),reuse_detected_at=now() WHERE family_id=$1 AND revoked_at IS NULL', [family.rows[0].family_id]);
      await audit(null, 'refresh_reuse_detected', false, ipKey, { familyId: family.rows[0].family_id });
    }
    throw new Error('Invalid session');
  }
  const nextAccess = randomToken(32);
  const nextRefresh = randomToken(48);
  const accessExpires = new Date(Date.now() + 30 * 60_000);
  const refreshExpires = new Date(Math.min(Date.now() + durations.sessionMs, row.absolute_expires_at.getTime()));
  if (refreshExpires <= new Date()) throw new Error('Session expired');
  await withTransaction(async client => {
    const locked = await client.query('SELECT id FROM sessions WHERE id=$1 FOR UPDATE', [row.session_id]);
    if (!locked.rowCount) throw new Error('Invalid session');
    const created = await client.query<{ id: string }>(
      `INSERT INTO sessions(user_id,device_id,token_hash,expires_at,absolute_expires_at,ip_hash,family_id,refresh_token_hash,refresh_expires_at)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [row.user_id,row.device_id,tokenHash(nextAccess),accessExpires,row.absolute_expires_at,hashIp(ipKey),row.family_id,tokenHash(nextRefresh),refreshExpires],
    );
    await client.query('UPDATE sessions SET revoked_at=now(),rotated_at=now(),replaced_by_session_id=$2 WHERE id=$1', [row.session_id, created.rows[0].id]);
  });
  await audit(row.user_id, 'session_rotated', true, ipKey);
  return { userId: row.user_id, deviceId: row.device_id, token: nextAccess, refreshToken: nextRefresh, expiresAt: accessExpires.toISOString(), refreshExpiresAt: refreshExpires.toISOString(), absoluteExpiresAt: row.absolute_expires_at.toISOString() };
}

export async function revoke(rawToken: string) {
  const auth = await authenticate(rawToken);
  if (!auth) return;
  await query('UPDATE sessions SET revoked_at=now() WHERE id=$1 AND revoked_at IS NULL', [auth.sessionId]);
  await audit(auth.userId, 'session_revoked', true);
}

export async function revokeAll(userId: string) {
  await query('UPDATE sessions SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL', [userId]);
  await audit(userId, 'all_sessions_revoked', true);
}

export async function listSessions(userId: string, currentSessionId: string) {
  const result = await query<{ id: string; device_id: string; label: string | null; created_at: Date; last_seen_at: Date; expires_at: Date; revoked_at: Date | null }>(
    `SELECT s.id,s.device_id,d.label,s.created_at,s.last_seen_at,s.expires_at,s.revoked_at
     FROM sessions s JOIN devices d ON d.id=s.device_id WHERE s.user_id=$1 ORDER BY s.last_seen_at DESC LIMIT 100`,
    [userId],
  );
  return result.rows.map(row => ({ id: row.id, deviceId: row.device_id, label: row.label ?? 'Unnamed device', createdAt: row.created_at.toISOString(), lastSeenAt: row.last_seen_at.toISOString(), expiresAt: row.expires_at.toISOString(), revoked: Boolean(row.revoked_at), current: row.id === currentSessionId }));
}

export async function revokeSession(userId: string, sessionId: string) {
  const result = await query<{ id: string }>('UPDATE sessions SET revoked_at=now() WHERE id=$1 AND user_id=$2 AND revoked_at IS NULL RETURNING id', [sessionId,userId]);
  if (!result.rowCount) throw new Error('Session not found');
  await audit(userId, 'session_revoked', true, undefined, { sessionId });
}

export async function createReauthGrant(userId: string, sessionId: string, password: string) {
  const result = await query<{ password_hash: string }>('SELECT password_hash FROM password_credentials WHERE user_id=$1', [userId]);
  if (!result.rows[0] || !(await verifyPassword(result.rows[0].password_hash, password))) throw new Error('Current password is incorrect');
  const token = randomToken(32);
  const expires = new Date(Date.now() + 10 * 60_000);
  await query('INSERT INTO reauth_grants(user_id,session_id,token_hash,expires_at) VALUES($1,$2,$3,$4)', [userId,sessionId,tokenHash(token),expires]);
  await audit(userId, 'reauthentication_succeeded', true, undefined);
  return { token, expiresAt: expires.toISOString() };
}

export async function verifyReauthGrant(userId: string, sessionId: string, token: string) {
  const result = await query<{ id: string }>('SELECT id FROM reauth_grants WHERE user_id=$1 AND session_id=$2 AND token_hash=$3 AND consumed_at IS NULL AND expires_at>now() LIMIT 1', [userId,sessionId,tokenHash(token)]);
  if (!result.rows[0]) throw new Error('Reauthentication required');
  await query('UPDATE reauth_grants SET consumed_at=now() WHERE id=$1', [result.rows[0].id]);
  return true;
}

export async function requestOtp(userId: string | null, destination: string, purpose: OtpPurpose, ipKey: string) {
  if (!consumeLimit(`otp:${ipKey}:${destination.slice(-6)}`, 5, 15 * 60 * 1000)) throw new Error('Too many OTP requests');
  const normalized = purpose === 'verify_email' ? normalizeEmail(destination) : normalizePhone(destination);
  const code = String(randomInt(100000, 1000000));
  const challengeId = randomUUID();
  const expires = new Date(Date.now() + durations.otpMs);
  await query('INSERT INTO otp_challenges(id,user_id,purpose,destination_fingerprint,code_hash,expires_at,last_sent_at) VALUES($1,$2,$3,digest($4,\'sha256\'),$5,$6,now())', [challengeId,userId,purpose,normalized,otpHash(challengeId,purpose,normalized,code),expires]);
  await audit(userId, 'otp_requested', true, ipKey, { purpose });
  return { challengeId, expiresAt: expires.toISOString() };
}

export async function verifyOtp(userId: string | null, destination: string, purpose: OtpPurpose, code: string) {
  if (!/^\d{6}$/.test(code)) throw new Error('Invalid OTP');
  const normalized = purpose === 'verify_email' ? normalizeEmail(destination) : normalizePhone(destination);
  const result = await query<{ id: string; user_id: string | null; attempts: number }>('SELECT id,user_id,attempts FROM otp_challenges WHERE user_id IS NOT DISTINCT FROM $1 AND purpose=$2 AND destination_fingerprint=digest($3,\'sha256\') AND consumed_at IS NULL AND expires_at>now() ORDER BY created_at DESC LIMIT 1', [userId,purpose,normalized]);
  const row = result.rows[0];
  if (!row || row.attempts >= 5) throw new Error('Invalid or expired OTP');
  const expected = otpHash(row.id,purpose,normalized,code);
  const matches = await query<{ ok: boolean }>('SELECT code_hash=$1 AS ok FROM otp_challenges WHERE id=$2', [expected,row.id]);
  if (!matches.rows[0]?.ok) {
    await query('UPDATE otp_challenges SET attempts=attempts+1 WHERE id=$1 AND consumed_at IS NULL', [row.id]);
    throw new Error('Invalid or expired OTP');
  }
  await query('UPDATE otp_challenges SET consumed_at=now() WHERE id=$1 AND consumed_at IS NULL', [row.id]);
  if (purpose === 'verify_email' && userId) await query('UPDATE users SET email_verified_at=now(),updated_at=now() WHERE id=$1 AND lower(email)=lower($2)', [userId,normalized]);
  if (purpose === 'verify_phone' && userId) await query('UPDATE users SET phone_verified_at=now(),updated_at=now() WHERE id=$1 AND phone=$2', [userId,normalized]);
  await audit(userId, 'otp_verified', true, undefined, { purpose });
  return true;
}

export async function requestPasswordReset(identifier: string, ipKey: string) {
  if (!consumeLimit(`password-reset:${ipKey}`, 5, 15 * 60 * 1000)) throw new Error('Too many reset requests');
  const normalized = identifier.trim().toLowerCase();
  const result = await query<{ id: string; email: string | null; phone: string | null }>('SELECT id,email,phone FROM users WHERE lower(username)=lower($1) OR lower(email)=lower($1) OR phone=$1 LIMIT 1', [normalized]);
  if (result.rows[0]) {
    const token = randomToken(32);
    const expires = new Date(Date.now() + durations.passwordResetMs);
    await query('UPDATE password_reset_challenges SET consumed_at=now() WHERE user_id=$1 AND consumed_at IS NULL', [result.rows[0].id]);
    await query('INSERT INTO password_reset_challenges(user_id,token_hash,expires_at) VALUES($1,$2,$3)', [result.rows[0].id,tokenHash(token),expires]);
    await audit(result.rows[0].id,'password_reset_requested',true,ipKey);
    // Delivery is intentionally external to account authority. Never return a reset token in production API responses.
  }
  return { ok: true, message: 'If the account exists, reset instructions have been sent.' };
}

export async function resetPassword(token: string, newPassword: string) {
  const passwordError = validatePassword(newPassword);
  if (passwordError) throw new Error(passwordError);
  return withTransaction(async client => {
    const row = await client.query<{ id: string; user_id: string }>('SELECT id,user_id FROM password_reset_challenges WHERE token_hash=$1 AND consumed_at IS NULL AND expires_at>now() LIMIT 1 FOR UPDATE', [tokenHash(token)]);
    if (!row.rows[0]) throw new Error('Invalid or expired reset token');
    const userId = row.rows[0].user_id;
    await client.query('UPDATE password_credentials SET password_hash=$2,changed_at=now() WHERE user_id=$1', [userId,await hashPassword(newPassword)]);
    await client.query('UPDATE password_reset_challenges SET consumed_at=now() WHERE id=$1', [row.rows[0].id]);
    await client.query('UPDATE sessions SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL', [userId]);
    await client.query('INSERT INTO account_recovery_events(user_id,method) VALUES($1,$2)', [userId,'password_reset']);
    return { ok: true, userId };
  }).then(async value => { await audit(value.userId,'password_reset_completed',true); return { ok: true }; });
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
