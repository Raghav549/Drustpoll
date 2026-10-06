# Drustpoll implementation audit — results

This records the outcome of a deep audit against `docs/ARCHITECTURE.md`,
`docs/FINAL_UX_SPEC.md`, `docs/DRUSTPOLL-FINAL-AUDIT-AND-COVERAGE.md`,
`docs/audit/DRUSTPOLL-END-TO-END-FINAL-AUDIT.md` and the `docs/design/*` closure contracts.

Unlike the contract documents, this file reports **what was measured**, with the
verification commands that produce the result.

## Headline finding

The repository contained a largely complete service layer whose capability was not
reachable. **64 of 129 client API calls had no server route** — the services existed in
`server/src/*-service.ts` but were never mounted on the HTTP surface. Several core flows
were additionally blocked by defects that made them impossible to complete at all.

## Blocking defects found and fixed

| # | Defect | Impact | Fix |
|---|---|---|---|
| 1 | `/v1/auth/otp/verify` sat behind an auth gate that rejects unverified sessions | **Account verification was impossible.** Signup requires verification; verification required a verified session. No user could ever complete signup. | OTP request/verify now authenticate with `allowUnverified`, before the strict gate (`auth-service.ts`, `index.ts`) |
| 2 | Server typecheck failure (`userId` used before assignment) | `npm run typecheck` red; signup cleanup path unsound | Corrected the optional binding |
| 3 | 64 client routes unmounted | Profile, discovery, reels extras, all commerce, media, measurement surfaces were dead | Added `profile-routes`, `discovery-routes`, `reels-routes`, `commerce-routes`, `media-routes`, `engagement-routes` |
| 4 | `listSavedPosts` filtered by **author**, not saver | Saved tab always empty | Rewrote the query against `post_saves` |
| 5 | `placeOrder` used `FOR UPDATE` across an outer join | **Checkout could never finalize** (Postgres error) | Scoped locking to `FOR UPDATE OF l,p,s` |
| 6 | Market list `ORDER BY p.created_at` against a CTE projection | Product browsing 400'd | Aliased to the projected columns |
| 7 | Recommendation SQL called a non-existent `clamp()` and omitted `p.category` | Shop recommendations 400'd | Used `GREATEST/LEAST`, projected the column, fixed the `GROUP BY` |
| 8 | `getDeliveryEstimate` selected `origin_region` from `shops` | Delivery estimates 400'd | Read from `product_shipping_profiles` |
| 9 | Privacy audit insert bound one param as both `uuid` and `text` | **Privacy settings could not be saved** | Explicit casts |
| 10 | Media readiness only promoted when *moderation* finished last | Uploads stuck in `scanning` forever | Promotion now re-checks after every job, requiring all-succeeded + approved + a real rendition |
| 11 | Local pipeline returned `rendition`, worker read `renditions[]` | Renditions never persisted, so assets never became ready | Aligned to the worker's contract |
| 12 | `content_features` had two incompatible shapes across migrations | **Reels feed 400'd** on `fused_features` | Migration `071` reconciles both shapes |
| 13 | `reauth_grants` only existed in the unused `server/migrations/` folder | Password reset broken on fresh databases | Migration `070` adds it to the real sequence |
| 14 | `020_design_system_hardening.sql` and `068_auth_cleanup…` were never registered | `ui_measurements` etc. missing on fresh installs | Registered in `migrate.ts` |
| 15 | Wrong table names (`recommendation_exposures`, `hidden_terms`) | Feed reset and settings read failures | Corrected to `recommendation_exposure`, `user_hidden_terms` |
| 16 | `/v1/auth/reauthenticate`, `/v1/auth/logout-all`, `/v1/safety/cases/:id/evidence` missing | Client called endpoints that did not exist | Implemented |
| 17 | Avatar/media keys returned raw, never resolved to URLs | Avatars and post media could not render | Added signed-URI hydration across feed, profile, comments, notifications, discovery, reels, market |
| 18 | Response shapes double-wrapped (`{items:{items:[]}}`, `{items:{topics:[]}}`) | Discovery history and feed controls broke | Normalized to the shape the screens read |
| 19 | Comments/replies returned `comments`, client read `items` | Comment lists never populated | Serve both keys |
| 20 | Web client hard-required an absolute API URL | Same-origin deployment impossible | Web falls back to same-origin; native still requires explicit HTTPS |
| 21 | `app/comments.tsx` was a stub that posted but never listed | Violated the Social Surface comments contract | Rebuilt with threads, pagination, reply composer, full state coverage |
| 22 | Profile tab strip had no `shop` label case | Shop tab rendered as "Saved" | Fixed label chain and the unreachable empty-state branch |
| 23 | 3 files excluded from typecheck | Type errors hidden from CI | Exclusions removed; app typechecks clean |

## Deliberately preserved boundaries

These are **correct** and were not "fixed" into fake success:

- Payment intent creation returns `503` until a provider is configured; no client-side
  payment success exists.
- Returns are refused on an order still awaiting verified payment.
- Reviews require a verified purchase.
- Media fails closed: unverified bytes never become playable.
- Business verification and E2EE remain explicit integration boundaries.
- Production rate-limit defaults are unchanged (120 req/min, 8 signups/hour); they are
  now env-tunable so trusted environments need no code edit.

## Verification

All commands below pass on this commit.

| Gate | Command | Result |
|---|---|---|
| App typecheck (no exclusions) | `npm run typecheck` | pass |
| Route parity | `node scripts/ci-route-parity.mjs` | **137/137** client routes resolve |
| i18n coverage | `node scripts/ci-i18n-coverage.mjs` | 47 locales |
| Expo/EAS config | `node scripts/eas-check-config.mjs` | pass |
| Web build | `npx expo export --platform web` | all routes exported |
| Server typecheck | `cd server && npm run typecheck` | pass |
| Server build | `cd server && npm run build` | pass |
| Server unit tests | `cd server && npm test` | 21/21 |
| **Full-stack E2E** | `node scripts/e2e-full-smoke.mjs` | **38/38** |

The E2E smoke runs against real PostgreSQL, real SMTP delivery (codes are read back from
a received message, not from the database), and the real media worker. It covers: auth and
the complete OTP verification round-trip, session management, reauthentication, profile and
avatar upload, social graph, feed, posts/comments/threads/polls/reposts, feed controls,
discovery, reels with watch sessions, the media pipeline end to end, measurement with
deduplication, the full commerce path (catalogue → cart → checkout → order → support),
notifications, messaging, privacy, safety, settings and the ads/payment boundaries.

## Known remaining boundaries

1. **Shared rate limiting** — the in-memory limiter is per-instance. Multi-instance
   production needs Redis/database backing (`server/DEPLOYMENT.md`).
2. **Audited E2EE** — messaging transports ciphertext; it is described as encrypted
   transport, not audited end-to-end encryption, per `docs/security/E2EE-BOUNDARY.md`.
3. **External providers** — payments, SMS, business verification, and production media
   inspection/transcoding require real credentials.
4. **Browser automation** — no browser is installable in the audit sandbox, so UI
   rendering was verified via the exported web build, route responses and the same-origin
   proxy rather than by driving a live DOM.
