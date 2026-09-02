# Drustpoll encrypted messaging boundary

Drustpoll stores an encrypted-message transport envelope and device public-key bundles. This is **not** a claim that the platform has implemented a novel end-to-end cryptographic protocol.

Production E2EE must use a reviewed, interoperable protocol implementation with audited key lifecycle behavior. The server-side boundary therefore enforces:

- device-scoped identity/signed-pre-key bundles with explicit key versions;
- block checks before conversation creation, key publication and message delivery;
- encrypted-envelope format/size validation without attempting to decrypt content;
- key-version consistency when a sender supplies a device ID;
- no server-side plaintext message search or indexing;
- short-lived authenticated API sessions and normal re-authentication for sensitive account operations.

The next protocol adapter must cover device verification, pre-key replenishment, key rotation/revocation, multi-device fan-out, recovery, replay handling and downgrade resistance before production E2EE is declared complete.
