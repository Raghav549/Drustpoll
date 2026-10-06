# Running Drustpoll locally

A full Drustpoll stack is: **PostgreSQL + API + media worker + web/native client**.
Everything below runs real code paths — there are no mocked success states.

## 1. Database

Any PostgreSQL 14+ instance works. Point `DATABASE_URL` at it and run the migrations:

```bash
cd server
npm install
DATABASE_URL=postgresql://user:pass@127.0.0.1:5432/drustpoll \
SESSION_PEPPER=<long-random> PASSWORD_PEPPER=<long-random> \
npx tsx src/migrate.ts
```

Migrations are deterministic and tracked in `schema_migrations`; re-running is safe.

## 2. API

```bash
cd server
PORT=4400 NODE_ENV=development \
DATABASE_URL=... SESSION_PEPPER=... PASSWORD_PEPPER=... \
MEDIA_STORAGE_DRIVER=local \
SMTP_HOST=127.0.0.1 SMTP_PORT=2525 SMTP_USER=dev SMTP_PASS=dev SMTP_FROM=noreply@drustpoll.dev \
npx tsx src/index.ts
```

## 3. Media worker

Media never becomes playable without the worker: uploads stay `scanning` until
probe/scan/thumbnail/moderation/transcode all succeed and a rendition exists.

```bash
cd server
DATABASE_URL=... SESSION_PEPPER=... PASSWORD_PEPPER=... MEDIA_STORAGE_DRIVER=local \
npx tsx src/run-media-worker.ts
```

## 4. Email (OTP) delivery

Signup requires a verified contact, and verification requires a real delivered code.
For local work, run the bundled SMTP sink, which accepts real SMTP sessions and writes
the received codes to a JSON file:

```bash
node scripts/dev-smtp-sink.mjs 2525 /tmp/drustpoll/otp.json
```

Point the API's `SMTP_*` variables at it. In production, configure a real SMTP provider —
the sink is a development transport only.

## 5. Client

### Web (single origin, recommended for local testing)

```bash
npx expo export --platform web
PORT=8080 API_TARGET=http://127.0.0.1:4400 node scripts/serve-web.mjs
```

`scripts/serve-web.mjs` serves the static build and reverse-proxies `/v1/*` and `/health`
to the API, so the browser talks to one origin. In this topology `EXPO_PUBLIC_API_URL`
can stay unset — the web client falls back to same-origin relative requests.

### Expo dev / native

```bash
EXPO_PUBLIC_API_URL=https://your-api.example.com npm start
```

Native builds **must** have an absolute HTTPS `EXPO_PUBLIC_API_URL`; there is no origin
to fall back to, and Android rejects cleartext LAN hosts.

## Storage drivers

| Driver | When | Behaviour |
|---|---|---|
| `s3` (default) | production | Short-lived presigned S3 URLs. Requires `S3_*` config; fails closed otherwise. |
| `local` (`MEDIA_STORAGE_DRIVER=local`) | dev / self-hosted / CI | Real bytes on the API host, served behind HMAC-signed expiring `/v1/media/content/*` URLs with range support. |

The local driver stores and verifies genuine bytes, but it is node-local and not durable —
use object storage for production.

## Media providers

Without `MEDIA_INSPECTOR_URL` / `MEDIA_PROCESSOR_URL`, the `local` driver uses the built-in
pipeline in `server/src/local-media-pipeline.ts`: real magic-byte sniffing, header-parsed
image dimensions, an explicit format/size moderation decision, ImageMagick thumbnails when
available, and an honest passthrough rendition for video (no fabricated transcode).
Configure the provider URLs to use external services instead. With the `s3` driver and no
providers configured, the pipeline fails closed exactly as before.

## Environment reference

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | — (required) | PostgreSQL connection string |
| `SESSION_PEPPER` | — (required) | Session/opaque-token hashing secret (also signs local media URLs) |
| `PASSWORD_PEPPER` | — (required) | Defense-in-depth pepper before Argon2id |
| `PUBLIC_ORIGIN` | `https://drustpoll.app` | Canonical origin used to absolutize signed URLs |
| `MEDIA_STORAGE_DRIVER` | `s3` | `s3` or `local` |
| `MEDIA_LOCAL_DIR` | `<cwd>/.media-store` | Local driver object root |
| `RATE_LIMIT_MAX_REQUESTS` | `120` | Requests per window per fingerprint |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate-limit window |
| `AUTH_LIMIT_SIGNUP` | `8` | Signups per IP per hour |
| `AUTH_LIMIT_LOGIN` | `20` | Logins per IP per 15 min |
| `AUTH_LIMIT_OTP` | `5` | OTP requests per IP/destination per 15 min |
| `AUTH_LIMIT_PASSWORD_RESET` | `5` | Reset requests per IP per 15 min |
| `PAYMENT_PROVIDER_NAME` / `PAYMENT_WEBHOOK_SECRET` | unset | Enables the payment provider boundary; unset ⇒ `503` on intent creation |

Auth and request limits are tunable so trusted environments (load tests, shared CI egress)
do not need code edits. **Defaults are the production security baseline.** Multi-instance
production still requires a shared Redis/database limiter per `server/DEPLOYMENT.md`.

## Verification

```bash
npm run typecheck                  # Expo app, zero exclusions
node scripts/ci-route-parity.mjs   # every client call has a server route
node scripts/ci-i18n-coverage.mjs  # locale coverage
npx expo export --platform web     # web build

cd server && npm run typecheck && npm run build && npm test

node scripts/e2e-full-smoke.mjs    # 38 checks across every product surface
```
