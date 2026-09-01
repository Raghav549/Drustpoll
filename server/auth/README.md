# Drustpoll Auth Server Boundary

This directory is reserved for the first-party authentication service. It is intentionally separate from the Expo client so authentication secrets and authorization logic cannot become UI concerns.

## Required modules

- account repository
- password hasher (Argon2id)
- session repository
- OTP challenge service
- rate-limit/abuse service
- recovery service
- device/session registry
- security-event writer
- authorization middleware
- reauthentication service

## Required invariants

- Never return password hashes, peppers, OTP secrets or raw session identifiers to the client.
- Never trust client-supplied user IDs, roles, ownership flags or verification state.
- Every mutation re-checks authorization on the server.
- Every session lookup is server-side and revocation-aware.
- Every authentication attempt is observable without logging secrets.
- Tests must cover replay, brute force, session fixation, credential stuffing, recovery abuse, privilege escalation and authorization bypass.

Implementation must use vetted cryptographic primitives rather than inventing cryptography.
