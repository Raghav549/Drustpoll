# Drustpoll end-to-end completion gate

This document is a living implementation gate, not a claim of completion by itself.

## Product principles

Drustpoll uses a distinct visual language rather than cloning another social product. Interaction design follows recognition over recall, visible system status, user control, error recovery, consistency, and aesthetic restraint. WCAG 2.2 is the accessibility baseline for web surfaces, including minimum 24px pointer targets and predictable input behavior. See W3C WCAG 2.2 and Nielsen Norman Group heuristics.

Psychology is used to improve comprehension, belonging, agency, curiosity and perceived competence—not to create deceptive urgency, fake social proof, hidden consent, or compulsive engagement. Commerce disclosures remain explicit and reversible where possible.

## Whole-surface audit

### Entry and identity
- Splash/loading: explicit first-run state, fast perceived progress, no misleading progress indicators.
- Auth: sign-in/sign-up, recovery, validation, error recovery, accessible credentials.
- Account: profile identity, contacts, password, sessions, passkeys, security events.

### Social
- Home, Explore, Reels, profile, create, connect, notifications.
- Every interactive state: idle, pressed, disabled, pending, success, failure, retry, offline, private, blocked, muted, removed.
- Feed controls and recommendation explanations are explicit, not covert.

### Profile-commerce model
- A profile remains a profile.
- A seller profile contains the storefront as an integrated surface: catalogue, categories, search, collections, product detail, reviews/Q&A, shipping, returns and checkout.
- Business verification is a separate trust/verification process from creator/user profile identity.
- A user/creator may separately enable professional mode and business/seller capabilities without changing the fundamental profile identity model.

### Commerce
- Product detail: real media, variants, price/inventory state, seller identity, delivery, policies, wishlist, reviews, questions, related products.
- Cart: media, price-change and availability states, saved-for-later, shipping context and recovery.
- Checkout: review → address → delivery → payment → confirmation, with server revalidation and idempotency.
- Orders: lifecycle, tracking, address snapshot, receipts, payment state, returns, refunds, exchange, issue/support flows, review state.
- Seller: product lifecycle, inventory, shipping mode, payment-method availability, storefront metadata.
- Delivery: seller-managed or configured provider boundary; credentials/secrets never stored in client code.

### Privacy/settings/safety
- Privacy: visibility, activity, discoverability, requests, personalization, blocked/muted, hidden words/topics, recommendation reset, feed reset, data inventory, export/delete request, permissions, audit history, legal transparency.
- Settings: account, security, sessions, passkeys, password, contacts, profile visibility, activity, discoverability, message requests, blocked/muted, hidden topics, recommendations, feed reset, ads/privacy, export/delete/history, permissions, accessibility, appearance, motion, data saver, notifications, language, region, currency, legal and security history.
- Safety: mute, block, restrict, report reason/context/evidence, confirmations, cases, appeals, notices, suspicious login/security alerts, account recovery, safety education.

## Verification gates

1. Static/type safety: app typecheck + server typecheck + build + tests.
2. Dependency/security checks: npm audit high+ gate where supported.
3. Route parity: every client function has a server route, and every required route is represented in the UI where user-facing.
4. Runtime boundaries: payment webhooks, media signing, provider handoff, business verification and deletion/export workers remain explicit integration boundaries.
5. No fake completeness: external provider credentials and audited cryptographic protocols remain deployment requirements where applicable.
6. Platform readiness: Expo Android/iOS/web route-safe surfaces, responsive desktop layout, touch targets and keyboard/focus behavior.
7. Visual QA: color roles, typography, custom SVG iconography, motion/reduced-motion, empty/loading/error/success states, and no copied visual identity.
