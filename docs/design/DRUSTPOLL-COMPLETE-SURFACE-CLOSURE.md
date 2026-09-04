# Drustpoll Complete Surface Closure Contract

Status: **active implementation contract**

This document closes the gap between the design master and executable product surfaces. A feature is not considered complete merely because a route exists or a happy-path button works.

## Definition of complete

Every surface must have:

- a defined primary job;
- complete navigation entry and exit paths;
- all required tabs/filters/secondary navigation;
- production controls and buttons;
- canonical custom SVG icons;
- semantic loading, focused/pressed, pending, success, error, recovered states;
- disabled, permission-denied, private, blocked, muted, deleted, moderated and expired states where applicable;
- offline/stale/queued/retry behavior where network state matters;
- accessibility names, roles, states, focus order, keyboard path on web, dynamic text and non-color state communication;
- privacy and authorization boundaries;
- analytics/measurement for user value, failure and guardrail metrics;
- server authority for security-sensitive and commerce-sensitive outcomes;
- deterministic rollback path for experiments and risky changes;
- automated tests for domain logic and route behavior.

## Global navigation

### Primary intents

Home, Explore, Create, Connect, Market, You.

### Contextual secondary navigation

- Home: For You, Following, Latest/Chronological, topic context, feed controls.
- Explore: search, people, posts, videos, products, shops, topics, recent/saved searches, categories.
- Create: text, photo, gallery, video, short video, poll, link, product, drafts.
- Connect: inbox, requests, groups, conversation, notifications, saved/pinned context.
- Market: discovery, categories, filters, sort, wishlist, cart, orders, seller studio.
- You: posts, videos, collections, tagged, saved, shop, creator/seller, settings.

## Surface closure matrix

| Surface | Required final surfaces and controls |
|---|---|
| Launch | splash, first-run, legal/consent, permissions rationale, restore session |
| Auth | sign in, sign up, identifier verification, password setup, forgot/reset, recovery, session/device verification, passkey/security-key when supported |
| Home | feed modes, topic feed, compose entry, post variants, comments, reactions, save, share, hide, not interested, mute, block, report, why-this, feed controls, reset, end-of-feed, offline snapshot |
| Explore | landing, global search, suggestions, people, posts, videos, products, shops, topics, emerging, category hubs, local discovery when allowed, recent/saved searches, filters, no-result recovery, privacy explanation |
| Reels | personalized/following/topic sequences, player, creator context, caption, comments, audio, related, share, save, not interested, hide creator, report, quality, playback, preload/data saver, reduced motion, offline/error |
| Profile | identity header, bio, relationship state, followers/following, mutuals, posts, videos, collections, tagged, saved, shop, catalogue, creator/seller info, verification, privacy state, activity state, safety actions |
| Create | chooser, text, photo, gallery, video, short video, poll, link, product post, product tags, drafts, editor, crop/trim, alt text, warning, audience, location, mentions, reply controls, preview, progress, success, retry, offline preservation |
| Messages | inbox, requests, unread, groups, conversation, attachments, voice note where supported, shared objects, replies, search, pin, disappearing settings, crypto/security state, device verification, block/mute/report, offline send queue, retry |
| Notifications | all, social, mentions/replies, follows, commerce/orders, security, system, grouped states, read/unread, mark-one/read-all, preferences, digest, quiet periods |
| Market | landing, categories, search, filters, sort, product cards, shop cards, seller context, recommendation explanation, stock state, offline snapshot |
| Product | gallery, video, variants, price, inventory, seller, save/wishlist, reviews, Q&A, related/similar, shipping, delivery, returns, support, add-to-cart pending/success/failure |
| Cart | rows, media, quantity controls, stale price, unavailable item, save/remove, seller grouping, totals, delivery context, checkout, empty/offline/recovery |
| Checkout | address, delivery, order summary, payment selection, payment handoff, pending, provider failure, retry, verified success, receipt, order link |
| Orders | order list, detail, lifecycle timeline, shipment, delivery, receipt, return/refund/exchange, support, issue reporting, privacy boundaries |
| Seller studio | storefront profile, catalogue, create/edit product, media, variants, inventory, price, shipping, orders, returns, payouts, analytics, pause/archive, audit/history |
| Settings | account, password, email/phone, sessions, passkeys, privacy, safety, recommendation controls, feed reset, data/privacy, permissions, accessibility, appearance, motion, data saver, notifications, language, region/currency, legal, data export/delete, security events |
| Privacy | profile visibility, activity, discovery, message requests, personalization, ads, hidden words/topics, blocked/muted managers, recommendation reset, export/delete, audit history |
| Safety | reason picker, evidence, block/mute confirmation, restriction, appeal, appeal status, content-removal notice, safety education, abuse recovery, security alert, suspicious login, device recovery |
| Web/tablet | persistent rail, two-pane list/detail where useful, keyboard navigation, focus ring, hover affordance, command/search surfaces, responsive density |

## Icon policy

One canonical `Icon` API is required. No text glyphs may act as interface icons in production surfaces. Use SVG assets for navigation, status, actions and empty-state symbols. Icon-only controls must have accessible labels.

## Interaction policy

Primary action hierarchy:

1. one dominant action;
2. secondary actions grouped contextually;
3. destructive actions separated and deliberate;
4. irreversible outcomes require server-confirmed success;
5. cancellation and privacy changes remain discoverable;
6. optimistic UI is limited to reversible state and must roll back on failure.

## Recommendation UX

Every recommendation surface must support, where applicable:

- why-this-appears;
- more like this;
- less like this;
- not interested;
- hide creator/item;
- following/latest alternative;
- reset recommendations;
- privacy-aware exclusions;
- diversity and repetition controls.

No recommendation explanation may be fabricated. Explanations must correspond to recorded ranking policy/features.

## Commerce UX

Before commitment the UI must show seller identity, item/variant, total cost, availability, delivery expectation, returns/support and payment state. Payment success is only shown after verified server/provider confirmation.

## Messaging security UX

Until a maintained, audited interoperable client E2EE implementation is integrated, the product must describe the system as encrypted-message transport rather than full audited E2EE. Never claim more cryptographic protection than the implementation provides.

## Measurement

Every major surface records, subject to privacy controls:

- screen open;
- useful-content latency;
- interaction latency;
- task success;
- error and recovery;
- meaningful interaction;
- diversity/novelty when ranking is involved;
- negative feedback;
- privacy comprehension/control change;
- accessibility defects;
- media start latency;
- commerce conversion plus return/negative outcomes;
- guardrail breaches.

## Completion gate

A surface is **complete** only when:

`design spec = route = controls = icons = states = backend contract = privacy = accessibility = offline/recovery = measurement = tests`

Anything less remains `partial`.
