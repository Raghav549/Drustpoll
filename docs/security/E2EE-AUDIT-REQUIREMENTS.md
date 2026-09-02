# Drustpoll E2EE Audit Requirements

Drustpoll must not claim end-to-end encryption merely because encrypted ciphertext is stored. Production messaging requires an audited, interoperable protocol with authenticated device identity, forward secrecy, post-compromise recovery, pre-key management, multi-device session handling, replay/downgrade resistance, verification UX, key rotation/revocation, secure recovery and explicit failure states.

Implementation gate:
1. Use a maintained, peer-reviewed/audited protocol implementation rather than a bespoke cryptographic construction.
2. Never send plaintext message bodies to the server.
3. Bind every ciphertext to conversation, sender device, protocol version and message counter/nonce through authenticated encryption.
4. Reject stale, replayed, malformed or downgraded envelopes.
5. Require device verification for high-risk identity changes and expose key-change warnings without blocking ordinary recovery.
6. Store only the minimum server-side metadata needed for routing, abuse prevention and delivery.
7. Add interoperability/property tests before production enablement.
8. Obtain an independent cryptographic audit before describing the feature as audited E2EE.

Until those gates pass, the server contract remains an encrypted-message persistence boundary, not a full E2EE guarantee.
