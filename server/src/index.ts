import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { config } from './config.js';
import { authenticate, changePassword, login, requestOtp, revoke, revokeAll, signup, verifyOtp } from './auth-service.js';

const json = (res: ServerResponse, status: number, body: unknown) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
};

async function body(req: IncomingMessage): Promise<any> {
  let data = '';
  for await (const chunk of req) {
    data += chunk;
    if (Buffer.byteLength(data) > 256 * 1024) throw new Error('Request too large');
  }
  if (!data) return {};
  return JSON.parse(data);
}

function bearer(req: IncomingMessage): string | null {
  const value = req.headers.authorization;
  return value?.startsWith('Bearer ') ? value.slice(7) : null;
}

function setSessionCookie(res: ServerResponse, token: string) {
  const secure = config.secureCookies ? '; Secure' : '';
  res.setHeader('Set-Cookie', `drustpoll_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict${secure}; Max-Age=2592000`);
}

function cookie(req: IncomingMessage, name: string): string | null {
  const raw = req.headers.cookie ?? '';
  const item = raw.split(';').map(v => v.trim()).find(v => v.startsWith(`${name}=`));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : null;
}

async function auth(req: IncomingMessage) {
  return authenticate(bearer(req) ?? cookie(req, 'drustpoll_session') ?? '');
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
    const ip = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ?? req.socket.remoteAddress ?? 'unknown';

    if (req.method === 'GET' && url.pathname === '/health') return json(res, 200, { ok: true, service: 'drustpoll-auth' });

    if (req.method === 'POST' && url.pathname === '/v1/auth/signup') {
      const input = await body(req);
      const result = await signup(input, ip);
      setSessionCookie(res, result.token);
      return json(res, 201, { userId: result.userId, deviceId: result.deviceId, expiresAt: result.expiresAt, token: result.token });
    }

    if (req.method === 'POST' && url.pathname === '/v1/auth/login') {
      const input = await body(req);
      const result = await login(input, ip);
      setSessionCookie(res, result.token);
      return json(res, 200, { userId: result.userId, deviceId: result.deviceId, expiresAt: result.expiresAt, token: result.token });
    }

    if (req.method === 'POST' && url.pathname === '/v1/auth/logout') {
      await revoke(bearer(req) ?? cookie(req, 'drustpoll_session') ?? '');
      res.setHeader('Set-Cookie', 'drustpoll_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');
      return json(res, 200, { ok: true });
    }

    const session = await auth(req);
    if (!session) return json(res, 401, { error: 'Unauthenticated' });

    if (req.method === 'POST' && url.pathname === '/v1/auth/logout-all') {
      await revokeAll(session.userId);
      res.setHeader('Set-Cookie', 'drustpoll_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');
      return json(res, 200, { ok: true });
    }

    if (req.method === 'POST' && url.pathname === '/v1/auth/password/change') {
      const input = await body(req);
      await changePassword(session.userId, String(input.currentPassword ?? ''), String(input.newPassword ?? ''));
      return json(res, 200, { ok: true, sessionsRevoked: true });
    }

    if (req.method === 'POST' && url.pathname === '/v1/auth/otp/request') {
      const input = await body(req);
      const destination = String(input.destination ?? '');
      const purpose = input.purpose;
      if (!destination || !['verify_email','verify_phone','login_step_up','password_reset'].includes(purpose)) return json(res, 400, { error: 'Invalid OTP request' });
      const result = await requestOtp(session.userId, destination, purpose, ip);
      return json(res, 202, result);
    }

    if (req.method === 'POST' && url.pathname === '/v1/auth/otp/verify') {
      const input = await body(req);
      await verifyOtp(session.userId, String(input.destination ?? ''), String(input.purpose ?? ''), String(input.code ?? ''));
      return json(res, 200, { ok: true });
    }

    return json(res, 404, { error: 'Not found' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed';
    const status = /Unauthenticated/i.test(message) ? 401 : /too many/i.test(message) ? 429 : /already in use|invalid|incorrect|expired/i.test(message) ? 400 : 500;
    return json(res, status, { error: status === 500 ? 'Internal server error' : message });
  }
});

server.listen(config.port, () => console.log(`Drustpoll auth server listening on :${config.port}`));
