# Drustpoll Security Evidence Log

## Authentication and sessions

**Evidence:** OWASP Authentication and Session Management Cheat Sheets; Expo Router protected-routes guidance.

**Applied direction:**
- Use framework/provider-managed authentication rather than home-grown credential/session primitives.
- Treat authenticated sessions as security-sensitive state.
- Use HTTPS/TLS for authenticated traffic.
- Never place authentication tokens or refresh credentials in browser localStorage/sessionStorage.
- Re-authenticate for sensitive account and transaction actions.
- Rotate/invalidate sessions after high-risk events and logout.
- Keep client route protection separate from server-side authorization; route guards are UX/navigation protection, not an authorization boundary.

## Privacy

Privacy settings are explicit, reversible controls rather than hidden defaults. Every server-side data access must independently enforce authorization and produce auditable security events where appropriate.

## Messaging

Private-message transport is designed around ciphertext rather than plaintext payloads. A production E2EE implementation must use a reviewed, interoperable cryptographic protocol/library and a tested device/key lifecycle; this contract does not claim E2EE merely because a field is named `ciphertext`.

## Commerce

Commerce authorization and payment state remain server-controlled. Social privacy boundaries do not replace seller/buyer authorization, inventory checks, payment verification or order-transition validation.

## Validation gate

Before production release, security controls require automated tests, abuse-case tests, dependency review and independent security review where feasible. Client-side checks alone are never considered sufficient authorization.
