# Drustpoll

**A privacy-first social network + social commerce platform.**

Drustpoll brings profiles, posts, short video, discovery, messaging, creator tools, and full shop/commerce capabilities into one smooth product.

## Status

Foundation phase. The repository starts intentionally small so the architecture can be built cleanly rather than accumulating demo-only code.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the initial system design and security principles.

## Product pillars

- Social: profiles, follows, posts, short video, stories, comments, reactions, saves and sharing.
- Discovery: Home feed, Explore, Search and personalized recommendations.
- Communication: private/group messaging, media, notifications, blocks and privacy controls.
- Commerce: every eligible profile can have a shop identity, with products, collections, cart, checkout, orders, reviews and seller tools.
- Trust: reporting, moderation, abuse prevention, privacy controls, session/device management and security audit events.
- Privacy: data minimization and end-to-end encryption where the feature's threat model requires server-inaccessible content (especially private messaging).

## Engineering rule

No fake success states, hard-coded payment states, client-trusted authorization, or placeholder production flows. Every production action must have a real server-authoritative state transition.
