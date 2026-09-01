# Drustpoll Privacy & Security Contract

## Identity boundaries

Social identity, authentication credentials, private messaging, commerce identity and payment-provider references are separate domains. A compromise in one domain must not automatically expose another.

## Private messaging

The intended production architecture is end-to-end encrypted messaging with forward secrecy, device/session keys, encrypted attachments and server-side ciphertext storage. The server should authenticate and route ciphertext without receiving message plaintext.

## Data minimization

Collect only data required for a declared feature. Do not retain raw behavioral data forever. Define retention windows, deletion workflows and export workflows before production launch.

## User control

Privacy controls are equal-weight choices. Users can make a profile private, control audience per post, manage mentions/tags, control discovery, revoke sessions, export data, delete data and reset recommendation history.

## Security engineering

- TLS everywhere in transit.
- Encryption at rest for sensitive storage.
- Secrets never committed to Git.
- Short-lived access tokens and rotating refresh/session credentials.
- Device/session inventory with remote revocation.
- Server-side authorization on every protected resource.
- Rate limiting and abuse detection at authentication, messaging, content and commerce boundaries.
- Immutable security/audit events without storing message plaintext.
- Dependency and secret scanning in CI.
- Threat modeling before adding high-risk features.
- Independent security testing before production launch.

## Privacy by default

The UI must not use dark patterns to increase data sharing. Research on choice architecture shows that defaults and presentation can materially change privacy decisions; Drustpoll therefore uses defaults that favor user control rather than platform extraction.

## Commerce

Payment credentials are handled by a compliant payment provider. Drustpoll stores only the minimum provider references required to reconcile orders. Order state transitions are server-authoritative and idempotent.
