# Drustpoll API deployment

## Required environment

- `DATABASE_URL` — PostgreSQL connection string.
- `SESSION_PEPPER` — long random secret used to hash opaque session tokens.
- `PASSWORD_PEPPER` — long random secret used as defense-in-depth before Argon2id.
- `PUBLIC_ORIGIN` — canonical Drustpoll web origin.
- `NODE_ENV=production`

Never commit these values.

## Render

The repository includes `render.yaml` with a web service and PostgreSQL database. The service builds the TypeScript server, runs deterministic migrations, then starts the API. The generated Render secrets are only a bootstrap mechanism; rotate them through the platform's secret manager during production hardening.

## Auth transport

Web clients use `HttpOnly; Secure; SameSite=Strict` session cookies. Native clients may use the bearer session returned by the API and must keep it in the platform secure credential store. Authentication credentials must never be put in browser localStorage/sessionStorage.

## OTP delivery

OTP generation and verification are owned by Drustpoll. Email/SMS infrastructure is only a delivery transport and must never become the account identity authority. A delivery adapter must be connected before enabling production OTP verification flows.

## Production gates

Before public launch, complete:

1. Shared production rate limiting (Redis/database-backed), not the in-memory fallback.
2. Real email/SMS OTP delivery and anti-abuse controls.
3. Password breach screening and recovery flow.
4. Session refresh/rotation endpoint and device/session management UI.
5. Automated auth abuse tests: brute force, replay, fixation, enumeration, recovery abuse and authorization bypass.
6. Independent security review where feasible.
