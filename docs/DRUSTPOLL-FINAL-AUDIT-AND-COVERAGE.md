# Drustpoll Final Audit & Coverage Contract

This document is the implementation gate for the product surfaces that must remain complete across Expo mobile and web.

## Product identity
- User/creator/professional identity is distinct from business verification.
- A profile remains a profile while its storefront behaves as a complete commerce website surface: search, categories, collections, product detail, cart, checkout, orders and seller policies.
- Seller payment methods are explicit and server-authoritative: UPI, card and COD where configured.
- Seller fulfillment supports seller-managed delivery or an external provider boundary. Credentials/secrets are never entered into ordinary profile UI.
- No fabricated provider success, payment success, verification or security state.

## Psychology / philosophy guardrails
- Attraction comes from coherence, recognition, novelty-with-control, social meaning, competence and clear feedback.
- Copy and layout should reduce cognitive load, reveal the next useful action, preserve reversibility where possible and make consequential choices explicit.
- No fake social proof, deceptive scarcity, forced consent, hidden opt-outs, confusing cancellation, or engagement traps.
- Safety and privacy controls must not be weakened to improve engagement.

## Settings coverage
Account, security, sessions, passkeys, password, verified email/phone, profile visibility, activity, discoverability, message requests, blocked, muted, hidden words/topics, recommendation controls, feed reset, ads/privacy, export/delete requests, download history/status, permissions, accessibility, appearance, motion, data saver, notifications, language, region, currency, legal and security/privacy audit history.

## Safety coverage
Mute, block, restrict, report reason, context, evidence, confirmation, case history, appeal, appeal state, removed-content notice, suspicious-login/security alerts, compromised-device recovery, safety education and abuse recovery.

## Commerce coverage
Product discovery and detail, media, variants, inventory states, price confidence/history, seller/storefront identity, wishlist, reviews, Q&A, shipping/delivery, saved-for-later, cart recovery, address, delivery choice, payment method availability, idempotent order creation, provider-state boundary, receipts, order timeline, tracking, returns, refunds, exchanges, order issues/support and seller contact/fulfillment signals.

## Verification gate
A surface is not considered complete until:
1. Its client state is represented for idle/loading/pending/success/error/empty/retry/offline/unavailable where relevant.
2. Server validation is authoritative for permissions, inventory, pricing, payment, privacy and safety.
3. The route/contract has a real persistence boundary instead of a local-only fake.
4. Mobile and web layout are intentional, not merely desktop content squeezed onto a phone.
5. Icons are custom SVGs from the canonical icon system.
6. CI typecheck/build/test is green on the final commit.
7. Any external integration is represented as a provider boundary until real credentials and sandbox/production behavior are configured.
