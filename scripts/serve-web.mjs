/**
 * Single-origin web preview server.
 *
 * Serves the exported Expo web build (`dist/`) and reverse-proxies the API routes
 * (`/v1/*`, `/health`) to the Drustpoll API process. This mirrors the supported
 * production topology where the web client and API share one origin, so the browser
 * never needs an absolute cross-origin API URL.
 *
 * Usage: node scripts/serve-web.mjs
 *   PORT        (default 8080)      port to listen on
 *   API_TARGET  (default http://127.0.0.1:4400)
 *   WEB_DIR     (default ./dist)
 */
import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat, readFile } from 'node:fs/promises';
import path from 'node:path';

const port = Number(process.env.PORT ?? 8080);
const apiTarget = (process.env.API_TARGET ?? 'http://127.0.0.1:4400').replace(/\/$/, '');
const webDir = path.resolve(process.env.WEB_DIR ?? path.join(process.cwd(), 'dist'));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
};

const isApiPath = (p) => p === '/health' || p.startsWith('/v1/');

async function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0]);
  const rel = clean.replace(/^\/+/, '');
  const candidates = [];
  if (rel) {
    candidates.push(path.join(webDir, rel));
    if (!path.extname(rel)) {
      candidates.push(path.join(webDir, `${rel}.html`));
      candidates.push(path.join(webDir, rel, 'index.html'));
    }
  } else {
    candidates.push(path.join(webDir, 'index.html'));
  }
  for (const candidate of candidates) {
    if (!candidate.startsWith(webDir)) continue;
    try {
      const info = await stat(candidate);
      if (info.isFile()) return { file: candidate, size: info.size };
    } catch {
      /* try next */
    }
  }
  return null;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  try {
    // ---- API proxy (same origin) ----
    if (isApiPath(url.pathname)) {
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) {
        if (['host', 'connection', 'content-length', 'transfer-encoding'].includes(key)) continue;
        headers.set(key, Array.isArray(value) ? value.join(', ') : String(value ?? ''));
      }
      const chunks = [];
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        for await (const chunk of req) chunks.push(chunk);
      }
      const upstream = await fetch(`${apiTarget}${url.pathname}${url.search}`, {
        method: req.method,
        headers,
        body: chunks.length ? Buffer.concat(chunks) : undefined,
        redirect: 'manual',
      });
      res.statusCode = upstream.status;
      upstream.headers.forEach((value, key) => {
        if (['content-encoding', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) return;
        res.setHeader(key, value);
      });
      const buffer = Buffer.from(await upstream.arrayBuffer());
      res.end(buffer);
      return;
    }

    // ---- Static web build ----
    const found = await resolveFile(url.pathname);
    if (found) {
      const ext = path.extname(found.file).toLowerCase();
      res.statusCode = 200;
      res.setHeader('Content-Type', MIME[ext] ?? 'application/octet-stream');
      res.setHeader('Content-Length', String(found.size));
      res.setHeader('X-Content-Type-Options', 'nosniff');
      if (ext === '.html') res.setHeader('Cache-Control', 'no-cache');
      else res.setHeader('Cache-Control', 'public, max-age=3600');
      if (req.method === 'HEAD') {
        res.end();
        return;
      }
      createReadStream(found.file).pipe(res);
      return;
    }

    // ---- SPA fallback for client-side routes ----
    const index = path.join(webDir, 'index.html');
    const html = await readFile(index);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.end(html);
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Preview server error' }));
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Drustpoll web preview on http://0.0.0.0:${port} (API proxied to ${apiTarget})`);
});
