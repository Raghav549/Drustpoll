# Drustpoll

**A privacy-first social network + social commerce platform.**

Drustpoll brings profiles, posts, short video, discovery, messaging, creator tools, and full shop/commerce capabilities into one smooth product.

## Status

The social, discovery, media, messaging and commerce surfaces are implemented end to end
against a server-authoritative API, and verified by a full-stack smoke that exercises
every surface with a real database, real email delivery and the real media worker.

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system design and security principles
- [`docs/RUNNING-LOCALLY.md`](docs/RUNNING-LOCALLY.md) — run the whole stack locally
- [`docs/audit/IMPLEMENTATION-AUDIT-RESULTS.md`](docs/audit/IMPLEMENTATION-AUDIT-RESULTS.md) — measured audit results and remaining boundaries

## Verification

```bash
npm run typecheck && node scripts/ci-route-parity.mjs   # app + client/server route parity
cd server && npm run typecheck && npm run build && npm test
node scripts/e2e-full-smoke.mjs                          # 38 checks, every product surface
```

## Product pillars

- Social: profiles, follows, posts, short video, stories, comments, reactions, saves and sharing.
- Discovery: Home feed, Explore, Search and personalized recommendations.
- Communication: private/group messaging, media, notifications, blocks and privacy controls.
- Commerce: every eligible profile can have a shop identity, with products, collections, cart, checkout, orders, reviews and seller tools.
- Trust: reporting, moderation, abuse prevention, privacy controls, session/device management and security audit events.
- Privacy: data minimization and end-to-end encryption where the feature's threat model requires server-inaccessible content (especially private messaging).

## Engineering rule

No fake success states, hard-coded payment states, client-trusted authorization, or placeholder production flows. Every production action must have a real server-authoritative state transition.
