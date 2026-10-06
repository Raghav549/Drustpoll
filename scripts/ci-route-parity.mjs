/**
 * Route parity gate.
 *
 * Verification gate #3 of docs/audit/DRUSTPOLL-END-TO-END-FINAL-AUDIT.md:
 * "every client function has a server route". This script extracts every API path
 * the Expo client calls and asserts the server declares a matching route, so a
 * frontend surface can never ship against an endpoint that does not exist.
 *
 * Usage: node scripts/ci-route-parity.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'server', '.expo', 'coverage', 'build']);

function walk(dir, filter, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.name !== '.github') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(full, filter, out);
    } else if (filter(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

// ---- 1. Collect client-side API paths -------------------------------------
const clientFiles = walk('.', (name) => /\.(ts|tsx)$/.test(name));
const calls = new Map(); // normalizedPath -> Set<sourceFile>

const CALL_RE = /\bapi(?:<[^>]*>)?\(\s*(`[^`]*`|'[^']*'|"[^"]*")/g;
const REQUEST_RE = /\brequest\(\s*(`[^`]*`|'[^']*'|"[^"]*")/g;

for (const file of clientFiles) {
  const src = fs.readFileSync(file, 'utf8');
  for (const re of [CALL_RE, REQUEST_RE]) {
    re.lastIndex = 0;
    let match;
    while ((match = re.exec(src))) {
      const raw = match[1].slice(1, -1);
      // Normalize to a comparable route shape: simple `${id}` segments become :param,
      // and anything from the first query separator or nested template is dropped.
      const normalized = raw
        .replace(/\$\{[^{}]*\}/g, ':param')
        .split('${')[0]
        .split('?')[0]
        .replace(/\/+$/, '');
      if (!normalized.startsWith('/v1/') && normalized !== '/health') continue;
      if (!calls.has(normalized)) calls.set(normalized, new Set());
      calls.get(normalized).add(file);
    }
  }
}

// Protocol constant map (src/core/auth/custom-auth-protocol.ts) also declares routes.
const protocolFile = 'src/core/auth/custom-auth-protocol.ts';
if (fs.existsSync(protocolFile)) {
  const src = fs.readFileSync(protocolFile, 'utf8');
  for (const match of src.matchAll(/'(\/v1\/[^']+)'/g)) {
    const normalized = match[1].split('?')[0];
    if (!calls.has(normalized)) calls.set(normalized, new Set());
    calls.get(normalized).add(protocolFile);
  }
}

// ---- 2. Collect server-declared routes ------------------------------------
const serverFiles = walk('server/src', (name) => /\.ts$/.test(name));
let serverSource = '';
for (const file of serverFiles) serverSource += fs.readFileSync(file, 'utf8') + '\n';

// Literal paths: '/v1/feed', `/v1/posts`
const serverLiterals = new Set();
for (const match of serverSource.matchAll(/['"`](\/(?:v1\/[A-Za-z0-9/_-]*|health))['"`]/g)) {
  serverLiterals.add(match[1].replace(/\/+$/, ''));
}

// Regex route patterns: /^\/v1\/posts\/([^/]+)\/comments$/
// Scanned by locating the literal start `/^\/v1` and reading to the closing `$/`,
// which tolerates character classes such as [^/]+ that contain slashes.
const serverPatterns = [];
for (let i = 0; i < serverSource.length; i++) {
  if (!serverSource.startsWith('/^\\/', i)) continue;
  const end = serverSource.indexOf('$/', i);
  if (end < 0) continue;
  const body = serverSource.slice(i + 1, end + 1); // include ^ ... $
  if (body.includes('\n')) continue;
  try {
    serverPatterns.push(new RegExp(body));
  } catch {
    /* ignore non-compiling fragments */
  }
  i = end + 1;
}

const SAMPLE_ID = '00000000-0000-4000-8000-000000000000';

function serverHandles(routePath) {
  const concrete = routePath.replace(/:param/g, SAMPLE_ID);
  if (serverLiterals.has(routePath) || serverLiterals.has(concrete)) return true;
  for (const pattern of serverPatterns) {
    pattern.lastIndex = 0;
    if (pattern.test(concrete) || pattern.test(routePath)) return true;
  }
  return false;
}

const missing = [];
for (const [routePath, sources] of [...calls].sort()) {
  if (!serverHandles(routePath)) missing.push([routePath, [...sources]]);
}

if (missing.length) {
  console.error(`Route parity FAILED: ${missing.length} client route(s) have no server handler.\n`);
  for (const [routePath, sources] of missing) {
    console.error(`  ${routePath}`);
    for (const source of sources) console.error(`      called from ${source}`);
  }
  console.error('\nEvery client API call must have a real server route (no local-only fakes).');
  process.exit(1);
}

console.log(`Route parity OK: ${calls.size} client API routes all resolve to server handlers.`);
