import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { config } from './config.js';
import { authenticate, changePassword, createReauthGrant, listSessions, login, refresh, requestOtp, requestPasswordReset, resetPassword, revoke, revokeAll, revokeSession, signup, verifyOtp } from './auth-service.js';
import { health } from './health.js';

const json = (res: ServerResponse, status: number, body: unknown) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.end(JSON.stringify(body));
};

async function body(req: IncomingMessage): Promise<any> {
  let data = '';
  for await (const chunk of req) {
    data += chunk;
    if (Buffer.byteLength(data) > 256 * 1024) throw new Error('Request too large');
  }
  return data ? JSON.parse(data) : {};
}

function bearer(req: IncomingMessage): string | null {
  const value = req.headers.authorization;
  return value?.startsWith('Bearer ') ? value.slice(7) : null;
}

function cookie(req: IncomingMessage, name: string): string | null {
  const item = (req.headers.cookie ?? '').split(';').map(v => v.trim()).find(v => v.startsWith(`${name}=`));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : null;
}

function setSessionCookie(res: ServerResponse, token: string, maxAgeSeconds = 1800) {
  const secure = config.secureCookies ? '; Secure' : '';
  const name = config.secureCookies ? '__Host-drustpoll_session' : 'drustpoll_session';
  res.setHeader('Set-Cookie', `${name}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict${secure}; Max-Age=${maxAgeSeconds}`);
}

function clearSessionCookie(res: ServerResponse) {
  const name = config.secureCookies ? '__Host-drustpoll_session' : 'drustpoll_session';
  res.setHeader('Set-Cookie', `${name}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${config.secureCookies ? '; Secure' : ''}`);
}

function sessionCookie(req: IncomingMessage) {
  return cookie(req, config.secureCookies ? '__Host-drustpoll_session' : 'drustpoll_session');
}

async function auth(req: IncomingMessage) {
  return authenticate(bearer(req) ?? sessionCookie(req) ?? '');
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
    const ip = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ?? req.socket.remoteAddress ?? 'unknown';

    if (req.method === 'GET' && url.pathname === '/health') return json(res, 200, await health());

    if (req.method === 'POST' && url.pathname === '/v1/auth/signup') {
      const result = await signup(await body(req), ip);
      setSessionCookie(res, result.token);
      return json(res, 201, { userId: result.userId, deviceId: result.deviceId, expiresAt: result.expiresAt, refreshExpiresAt: result.refreshExpiresAt, refreshToken: result.refreshToken, token: result.token });
    }

    if (req.method === 'POST' && url.pathname === '/v1/auth/login') {
      const result = await login(await body(req), ip);
      setSessionCookie(res, result.token);
      return json(res, 200, { userId: result.userId, deviceId: result.deviceId, expiresAt: result.expiresAt, refreshExpiresAt: result.refreshExpiresAt, refreshToken: result.refreshToken, token: result.token });
    }

    if (req.method === 'POST' && url.pathname === '/v1/auth/refresh') {
      const input = await body(req);
      const token = String(input.refreshToken ?? '');
      const result = await refresh(token, ip);
      setSessionCookie(res, result.token);
      return json(res, 200, { userId: result.userId, deviceId: result.deviceId, expiresAt: result.expiresAt, refreshExpiresAt: result.refreshExpiresAt, refreshToken: result.refreshToken, token: result.token });
    }

    if (req.method === 'POST' && url.pathname === '/v1/auth/password/forgot') {
      return json(res, 202, await requestPasswordReset(String((await body(req)).identifier ?? ''), ip));
    }

    if (req.method === 'POST' && url.pathname === '/v1/auth/password/reset') {
      const input = await body(req);
      return json(res, 200, await resetPassword(String(input.token ?? ''), String(input.newPassword ?? '')));
    }

    if (req.method === 'POST' && url.pathname === '/v1/auth/logout') {
      await revoke(bearer(req) ?? sessionCookie(req) ?? '');
      clearSessionCookie(res);
      return json(res, 200, { ok: true });
    }

    if (req.method === 'POST' && url.pathname === '/v1/auth/otp/request') {
      const input = await body(req);
      const destination = String(input.destination ?? '');
      const purpose = input.purpose;
      if (!destination || !['verify_email','verify_phone','login_step_up','password_reset'].includes(purpose)) return json(res, 400, { error: 'Invalid OTP request' });
      const session = await auth(req);
      const publicPurposes = ['verify_email','verify_phone','password_reset'];
      if (!session && !publicPurposes.includes(purpose)) return json(res, 401, { error: 'Unauthenticated' });
      return json(res, 202, await requestOtp(session?.userId ?? null, destination, purpose, ip));
    }

    if (req.method === 'POST' && url.pathname === '/v1/auth/otp/verify') {
      const input = await body(req);
      const purpose = String(input.purpose ?? '');
      const session = await auth(req);
      if (!session && !['password_reset'].includes(purpose)) return json(res, 401, { error: 'Unauthenticated' });
      await verifyOtp(session?.userId ?? null, String(input.destination ?? ''), purpose as any, String(input.code ?? ''));
      return json(res, 200, { ok: true });
    }

    const session = await auth(req);
    if (!session) return json(res, 401, { error: 'Unauthenticated' });

    if (req.method === 'GET' && url.pathname === '/v1/auth/me') return json(res, 200, { session });

    if (req.method === 'GET' && url.pathname === '/v1/auth/sessions') return json(res, 200, { sessions: await listSessions(session.userId, session.sessionId) });

    const revokeMatch = url.pathname.match(/^\/v1\/auth\/sessions\/([^/]+)$/);
    if (req.method === 'DELETE' && revokeMatch) {
      await revokeSession(session.userId, revokeMatch[1]);
      return json(res, 200, { ok: true });
    }

    if (req.method === 'POST' && url.pathname === '/v1/auth/logout-all') {
      await revokeAll(session.userId);
      clearSessionCookie(res);
      return json(res, 200, { ok: true });
    }

    if (req.method === 'POST' && url.pathname === '/v1/auth/reauthenticate') {
      const input = await body(req);
      return json(res, 200, await createReauthGrant(session.userId, session.sessionId, String(input.password ?? '')));
    }

    if (req.method === 'POST' && url.pathname === '/v1/auth/password/change') {
      const input = await body(req);
      await changePassword(session.userId, String(input.currentPassword ?? ''), String(input.newPassword ?? ''));
      clearSessionCookie(res);
      return json(res, 200, { ok: true, sessionsRevoked: true });
    }

    return json(res, 404, { error: 'Not found' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed';
    const status = /Unauthenticated/i.test(message) ? 401 : /too many/i.test(message) ? 429 : /already in use|invalid|incorrect|expired|required/i.test(message) ? 400 : 500;
    return json(res, status, { error: status === 500 ? 'Internal server error' : message });
  }
});

server.listen(config.port, () => console.log(`Drustpoll auth server listening on :${config.port}`));
