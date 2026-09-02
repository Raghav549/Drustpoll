# Drustpoll UI Implementation Map

Status: **active implementation contract**

This map turns `DRUSTPOLL-COMPLETE-DESIGN-SYSTEM.md` into an implementation checklist. A surface is only ready when its visual, interaction, responsive, accessibility, offline, failure/recovery, privacy, performance, psychology, commerce/personalization, and measurement behaviors are represented in code or a tracked issue.

## 1. System layers

### Layer A — foundations
- semantic color tokens;
- typography and dynamic type;
- spacing/radius/elevation;
- motion and reduced-motion policy;
- responsive layout classes;
- accessibility primitives;
- interaction-state model;
- safe feedback/announcement helpers.

### Layer B — global shell
- adaptive phone navigation;
- desktop persistent rail;
- route-aware active state;
- safe-area handling;
- focus/pressed/disabled behavior;
- back-navigation continuity.

### Layer C — reusable primitives
- Surface;
- AppText;
- SectionHeader;
- Action/Button;
- IconButton;
- Chip;
- SearchField;
- StateView;
- OfflineBanner;
- Divider;
- ScreenScroll.

## 2. State completeness contract

For each interactive control, explicitly represent:

`idle → focused/pressed → pending → success | error → recovered | idle`

and, when applicable:

`disabled | selected | unavailable | permission-denied | offline | private | blocked | muted | deleted | moderated | expired`

Rules:
- irreversible operations require confirmed server success before durable success UI;
- optimistic updates require safe rollback;
- offline actions must disclose queued/retry state;
- errors must explain the next useful action;
- destructive actions require deliberate confirmation;
- color is never the only state signal.

## 3. Page implementation matrix

| Surface | Primary job | Dominant component grammar | Required state families |
|---|---|---|---|
| Home | social context | editorial feed + quiet zones | loading, refresh, error, empty, stale/offline, privacy-filtered, ranking explanation |
| Explore | discovery | search + chips + result sections | suggestion, active query, no-result recovery, offline history, privacy-aware results |
| Reels | focused media discovery | full-bleed media + contextual overlay | loading, playback error, pause/resume, reduced motion, data saver, offline, action pending/success |
| Profile | identity | identity header + contextual tabs | public/private, follow state, blocked/muted, empty, loading, edit state |
| Create | expression | task-first composer | draft, permission, upload progress, validation, offline queue, publish success/failure |
| Connect | relationships | inbox + conversation context | unread, request, sending, sent, failed, retry, offline, security state |
| Market | commerce discovery | editorial product modules | recommendation explanation, stock, price, seller context, offline snapshot |
| Product | purchase confidence | product evidence stack | variant, inventory, shipping, reviews, save, add-to-cart, failure/recovery |
| Cart | decision checkpoint | compact rows + totals | quantity pending, stale price, unavailable item, empty, offline |
| Checkout | commitment | explicit step sequence | review, submission, payment-pending, payment-confirmed, payment-failed, recovery |
| Orders | fulfilment | status timeline | pending, shipped, delivered, return/refund, support, privacy |
| Settings | user control | grouped preference sections | current state, changed, saved, unsaved, failure, permission |
| Privacy | boundary control | plain-language controls | public/private, discoverability, activity, requests, audit feedback |
| Safety | harm recovery | calm decisive flows | report, block, mute, restriction, appeal, security alert |

## 4. Responsive rules

### Compact phone <360px
Reduce secondary copy, preserve 44px touch targets, avoid horizontal overflow, collapse nonessential metadata.

### Phone 360–767px
One dominant task per viewport; contextual controls may use sheets.

### Tablet 768–1099px
Use two-pane layouts where context reduces decision cost: list/detail, feed/detail, product/detail, inbox/conversation.

### Desktop ≥1100px
Use persistent navigation rail, wider content columns, keyboard navigation, hover/focus affordances, and denser comparison layouts.

Never shrink the phone composition mechanically to make desktop.

## 5. Accessibility contract

Every page/component must have:
- semantic role/name/state;
- keyboard path on web;
- dynamic text support;
- visible focus;
- minimum touch target;
- non-color state explanation;
- field-level errors;
- logical reading order;
- captions/alt text where required;
- reduced-motion behavior.

## 6. Offline contract

Each network surface resolves to one of:

1. fresh online;
2. stale but usable;
3. offline with queued action;
4. unavailable with recovery.

Queues must be bounded, idempotent, retry with backoff, and safe to replay. User-authored work is preserved whenever possible.

## 7. Privacy contract

- collect only feature-necessary data;
- expose audience before publishing;
- keep recommendation controls user-visible;
- do not infer sensitive traits for commerce;
- never fabricate recommendation explanations;
- private content must not appear through discovery or social graph expansion;
- privacy changes must show the resulting state and be auditable.

## 8. Psychology contract

Use psychology to improve comprehension, confidence, connection, curiosity, and control. Never use fabricated urgency, deceptive social proof, coercive defaults, hidden privacy controls, or notification escalation for compulsive checking.

Primary optimization targets:
- comprehension;
- successful task completion;
- recovery;
- meaningful interaction;
- discovery quality;
- commercial confidence;
- long-term value and satisfaction.

Session duration alone is not a success metric.

## 9. Personalization contract

Personalized surfaces combine, where appropriate:
- recent intent;
- long-term affinity;
- relationship;
- freshness;
- novelty;
- creator/topic/item diversity;
- negative feedback;
- safety;
- fairness;
- fatigue/repetition;
- privacy-permitted context.

Visible controls include why-this-appears, less/more-like-this, hide/mute, following/latest, and reset recommendations.

## 10. Commerce contract

Before commitment the interface must make clear:
- seller identity;
- item/variant;
- total cost;
- availability;
- delivery expectation;
- returns/support;
- payment state.

No UI may imply payment success before provider/server confirmation.

## 11. Measurement contract

Instrument:
- time to useful content;
- interaction latency;
- task completion;
- error recovery;
- meaningful interaction rate;
- diversity/novelty;
- negative feedback;
- privacy comprehension;
- accessibility defects;
- media start latency;
- commerce conversion with confidence/return signals;
- guardrail breaches and rollback triggers.

## 12. Build sequence

1. foundations and shell;
2. primitives;
3. Home/Explore/Profile;
4. Create/Connect;
5. Reels;
6. Market/Product/Cart/Checkout/Orders;
7. Privacy/Security/Safety;
8. offline/reliability;
9. instrumentation;
10. visual regression/accessibility testing;
11. production hardening.

## Definition of done

A Drustpoll surface is not complete because it looks finished. It is complete only when the user can understand where they are, what happened, why they see something, what they can do next, and how to change or recover important choices.
