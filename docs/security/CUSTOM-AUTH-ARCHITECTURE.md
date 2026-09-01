# Drustpoll First-Party Authentication

## Decision
Drustpoll's account authentication is first-party. We are not using Clerk, Auth0, Firebase Authentication, Supabase Auth, Cognito, or social-login providers as the account authority.

OTP delivery providers may be used as transport infrastructure, but Drustpoll owns the account, challenge, verification, session, recovery, authorization and audit state.

## Security model

1. **Password storage** — Argon2id with per-account random salts and a server-held pepper. Never plaintext, reversible encryption, SHA-256-only password hashing, or client-side password storage.
2. **Account identifiers** — opaque random internal user IDs; usernames are presentation identifiers and are not authorization keys.
3. **Sessions** — opaque, cryptographically random identifiers with at least 128 bits of entropy; server-side session state; rotation after authentication/privilege changes; explicit revocation and expiry.
4. **Web storage** — authenticated browser sessions use Secure, HttpOnly, SameSite cookies. Authentication credentials are never placed in localStorage/sessionStorage.
5. **Native storage** — native session credentials go through the platform secure credential-store adapter; the app domain does not expose raw credentials to arbitrary UI code.
6. **OTP** — short-lived, single-use challenges, attempt limits, resend throttling, destination binding and replay protection.
7. **Recovery** — password reset is a separate high-risk flow. Existing sessions can be invalidated and the account is not silently logged in after reset.
8. **Reauthentication** — required for password/email/phone changes, account deletion, payout changes, sensitive commerce changes and other high-risk operations.
9. **Rate limiting** — login, signup, OTP, password reset and recovery endpoints are independently throttled with abuse detection.
10. **Auditability** — security events are append-only and contain no passwords, OTP values, session secrets or message plaintext.
11. **Authorization** — authentication establishes identity; every private resource separately checks authorization. A client route guard is never treated as an authorization boundary.
12. **Transport** — production authentication requires TLS. Credentials are never accepted over plaintext transport.

## Explicit non-goals

- No custom cryptographic password algorithm.
- No homemade encryption primitive.
- No JWT used as the sole server-side session authority.
- No predictable user IDs.
- No permanent bearer tokens in browser storage.
- No account recovery based only on an easily guessable personal fact.

## Evidence

The password-storage policy follows OWASP guidance favoring Argon2id, unique salts and work factors rather than fast hashes. The session model follows OWASP guidance for unpredictable server-side session identifiers, rotation, expiry and revocation. NIST guidance supports throttling authentication attempts and avoiding arbitrary password-composition rules.

References reviewed on 2026-09-02:
- OWASP Password Storage Cheat Sheet
- OWASP Authentication Cheat Sheet
- OWASP Session Management Cheat Sheet
- OWASP Forgot Password Cheat Sheet
- OWASP Cryptographic Storage Cheat Sheet
- NIST SP 800-63B authenticator guidance

## Implementation gate

This document is an architecture contract, not a claim that production authentication is complete. The next implementation phase must include the actual backend handlers, database constraints, rate-limit store, secure secret management, integration tests, abuse tests and end-to-end verification before auth is considered production-ready.
