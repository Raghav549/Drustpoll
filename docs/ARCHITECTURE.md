# Drustpoll — Architecture Foundation

Drustpoll is planned as a privacy-first social commerce platform combining social profiles, posts, short video, messaging, discovery, creator tools, shops, cart, checkout, orders, and seller operations.

## Product principles

1. Privacy and data minimization by default.
2. Smooth, fast, mobile-first interaction model.
3. Clear separation between public social data and private user/account data.
4. Real functionality only; no placeholder/demo flows in production paths.
5. Modular architecture so social, commerce, messaging, and discovery can scale independently.

## Core domains

- Identity & authentication
- Profiles, follows, blocks, privacy controls
- Posts, comments, reactions, saves, shares
- Short-video feed and media processing
- Stories and ephemeral content
- Feed, Explore, Search and recommendations
- Direct messaging, group messaging and notifications
- Creator/professional accounts
- Shops, products, collections and seller profiles
- Cart, checkout, addresses, payments, orders, returns/refunds
- Reviews and seller reputation
- Moderation, abuse prevention and reporting
- Privacy center, device/session management and audit events

## Security baseline

- TLS for all network transport.
- Passwords must never be stored in plaintext; use a modern password hashing scheme through the chosen identity provider.
- Access controlled by server-side authorization, never by client UI alone.
- Row/object-level authorization for user-owned and private resources.
- Signed/short-lived media URLs where appropriate.
- Secrets only in server-side environment/secret stores.
- Rate limiting and abuse controls on authentication, messaging, comments, follows, and commerce actions.
- Sensitive security events recorded in tamper-resistant audit logs without storing unnecessary personal content.
- Encrypt sensitive stored data where the threat model requires it.
- For true end-to-end encrypted messaging, encryption/decryption keys remain client-side; servers should transport ciphertext and required metadata only.

## Recommendation architecture

The ranking system should be its own service/module. It can combine candidate generation, feature extraction, scoring, policy/safety filtering, diversity, freshness, and feedback learning. Publicly observable engagement signals should not be treated as the complete algorithm; the implementation should be measurable and tunable through server-side configuration.

## Commerce architecture

Commerce must use explicit order/payment state machines. A client must never be trusted to mark an order paid, fulfilled, refunded, or delivered. Payment-provider webhooks and server-side verification are authoritative.

## Initial implementation sequence

1. Repository/app foundation.
2. Design system and navigation shell.
3. Authentication + session/device security.
4. Profile/social graph.
5. Posts + media pipeline.
6. Feed/Explore/Search.
7. Messaging/notifications.
8. Shop/product/catalog.
9. Cart/checkout/orders.
10. Moderation, privacy center, observability and hardening.
