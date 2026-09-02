# Drustpoll Complete Design System

Status: **Design master specification — implementation gate**

Drustpoll is a social + commerce platform designed from first principles. It may compete with the breadth of major social platforms, but it must not visually or behaviorally copy Instagram, TikTok, Facebook, X, Amazon, or any other product. The goal is a distinct interaction language: calm, magnetic, expressive, commercially useful, privacy-first, and extremely fast to understand.

This document is the source of truth for the product's visual language, information architecture, interaction behavior, psychological principles, page inventory, responsive behavior, accessibility, and research gates. No surface is considered "done" until its states, failure paths, accessibility, loading/offline behavior, privacy behavior, and measurement plan are defined.

## 1. Non-negotiable product philosophy

### 1.1 Agency before influence

The product may use psychology to improve comprehension, confidence, connection, curiosity, and delight. It must never use psychology to bypass informed choice.

Forbidden patterns:
- fake scarcity or fabricated urgency;
- hidden cancellation or privacy controls;
- deceptive countdowns;
- fake social proof or fabricated activity;
- notification escalation intended to create compulsive checking;
- preselected privacy exposure;
- misleading confirmation states;
- ads disguised as ordinary content;
- dark patterns that make acceptance easier than refusal.

### 1.2 Attraction through coherence

The first impression should come from composition rather than decoration:
- strong hierarchy;
- recognizable navigation landmarks;
- excellent typography;
- generous but efficient spacing;
- expressive media framing;
- tactile states;
- predictable motion;
- immediate feedback;
- consistent semantics across social and commerce.

Aesthetic quality matters because recent HCI meta-analysis evidence reports a small-to-medium positive effect of aesthetics on user performance, while also warning that effects vary by device, typography, experience, and study quality. Therefore aesthetics are treated as a usability multiplier, not a substitute for usability.

### 1.3 Flow without captivity

The interface should make the next useful action obvious while keeping exit, context switching, privacy, and control easy.

The design optimizes:
- time-to-comprehension;
- perceived responsiveness;
- task completion;
- recovery from errors;
- meaningful social connection;
- discovery quality;
- commercial confidence;
- long-term satisfaction.

It does **not** optimize raw session length as a primary product goal.

### 1.4 Plurality of the person

A user is not a single interest vector. The system must preserve room for temporary interests, changing identities, exploration, contradiction, and deliberate resets.

Every personalized surface therefore has explicit room for:
- recent intent;
- long-term preference;
- relationship context;
- novelty;
- diversity;
- exploration;
- negative feedback;
- user controls;
- safety;
- fairness.

### 1.5 No AI dependency

Core behavior must work without generative AI or opaque AI services. Advanced deterministic, statistical, graph, ranking, retrieval, and personalization methods are allowed only where they are auditable, measurable, privacy-conscious, and supported by credible research.

---

# 2. Research operating system

Every design decision follows this sequence:

1. Define the human problem.
2. Identify the relevant HCI, psychology, behavioral-science, accessibility, security, privacy, recommender, or commerce literature.
3. Prefer peer-reviewed evidence, systematic reviews, meta-analyses, replicated experiments, and well-validated engineering methods.
4. Select the strongest applicable method rather than the newest method merely because it is new.
5. Record expected benefit, uncertainty, trade-offs, failure modes, and abuse modes.
6. Implement the smallest production-testable version.
7. Instrument user-value and harm metrics.
8. Test accessibility, performance, privacy, security, offline behavior, and recovery.
9. Use controlled experiments where causal evidence is needed.
10. Keep rollback and user-control paths.

### Research foundations currently governing the design

- **Aesthetic usability / performance:** 2026 meta-analysis, *Attractive Things Do Work Better: A Meta-Analysis on Visual Aesthetics and User Performance* — 31 studies, 234 effect sizes, 18,794 participants; positive overall effect with substantial heterogeneity. Use as support for disciplined visual quality, not as proof that decoration improves every interface.
- **Adaptive personalization:** 2026 systematic review, *Adaptive Personalized Recommendation Systems* — reviews 97 studies and emphasizes adaptation to changing user preferences, contextual cues, and short- plus long-term signals.
- **Recommender practice:** 2026 comprehensive review, *A comprehensive review of recommender systems: Transitioning from theory to practice* — covers filtering, graph/deep systems, applications, fairness, and practical trade-offs.
- **E-commerce personalization:** 2025 systematic review of 21 Scopus-indexed studies — personalization is associated with satisfaction/loyalty/conversion, while privacy, bias, and implementation complexity remain important constraints.
- **E-commerce recommender trends:** 2026 review — highlights explainability, fairness, privacy-aware recommendation, multimodal product information, and adaptive policies.
- **Consumer fairness:** systematic survey of consumer-side fairness methods and evaluation; diversity and long-tail exposure are relevant to recommendation quality and fairness.
- **Multi-stakeholder fairness:** 2026 work argues that consumers, providers, and items should all be treated as stakeholders in recommendation allocation.
- **User control:** 2026 short-video recommender design study reports that transparent, user-friendly controls can increase perceived empowerment and understanding of recommendation steering.
- **Wellbeing:** 2026 systematic review of social-media interventions shows that social platforms can support positive outcomes, reinforcing the need to design for constructive use rather than only attention capture.

These papers do not justify copying their interfaces. They justify design principles and evaluation criteria. Evidence strength and applicability are logged before implementation.

---

# 3. Drustpoll visual identity

## 3.1 Core visual idea: "Living Canvas"

Drustpoll should feel like a living editorial canvas rather than a stack of cards.

Characteristics:
- asymmetrical but controlled composition;
- large media moments surrounded by quiet information zones;
- a distinctive navigation rail/pill system instead of copied tab bars;
- strong typographic rhythm;
- restrained surfaces;
- meaningful color reserved for action/state;
- commerce and social content share the same visual grammar but have different semantic accents;
- no generic glassmorphism everywhere;
- no neon/cyberpunk aesthetic;
- no imitation of Instagram's familiar top/bottom structure.

## 3.2 Color architecture

Define semantic tokens, not page-specific colors.

- `canvas`: primary app background.
- `surface`: elevated content surface.
- `surface-strong`: focused/selected surface.
- `ink`: primary text.
- `ink-muted`: secondary text.
- `line`: structural divider.
- `brand`: Drustpoll identity color.
- `accent-social`: social interaction accent.
- `accent-commerce`: purchase/cart/order accent.
- `success`, `warning`, `danger`, `info`.
- `media-scrim`: media readability overlay.

Rules:
- never communicate state by color alone;
- maintain WCAG-compliant contrast;
- support system light/dark/high-contrast preferences;
- colors are semantic so future visual refreshes do not require component rewrites.

## 3.3 Typography

Use a highly legible variable sans family with a distinctive display weight for editorial moments.

Token levels:
- display-xl;
- display-lg;
- title-xl;
- title-lg;
- title-md;
- body-lg;
- body-md;
- body-sm;
- label-lg;
- label-md;
- label-sm;
- numeric/display for prices and counts.

Rules:
- numeric information uses tabular figures where comparison matters;
- line length is constrained on reading surfaces;
- text hierarchy never depends only on font weight;
- dynamic type is supported on mobile.

## 3.4 Shape language

Use one coherent radius family with three semantic levels:
- `tight`: controls, compact chips;
- `soft`: cards, media containers;
- `hero`: major media and commerce imagery.

Avoid excessive rounded capsules. Pills are reserved for filters, status, or compact actions.

## 3.5 Elevation

Prefer contrast and spacing over heavy shadows.

Elevation levels:
- 0: canvas;
- 1: surface separation;
- 2: floating control;
- 3: modal/command surface.

---

# 4. Motion system

Motion is semantic continuity, not decoration.

## 4.1 Motion rules

- tap feedback: immediate;
- state transition: short and interruptible;
- navigation transition: preserve spatial relationship;
- media transition: maintain subject continuity;
- modal presentation: show hierarchy and dismissal path;
- list insertion: animate only the affected region;
- loading: use skeletons only when they reduce uncertainty;
- reduced-motion preference disables nonessential movement.

## 4.2 Motion tokens

- `instant`: direct state acknowledgement;
- `quick`: micro-interaction;
- `standard`: component transition;
- `emphasis`: rare hero transition.

No animation may delay an essential action.

## 4.3 Haptic/audio feedback

Where platform-supported:
- subtle confirmation for successful irreversible actions;
- softer feedback for reversible actions;
- no reward-like haptic loops for passive scrolling;
- muteable sound and respectful system settings.

---

# 5. Global information architecture

Drustpoll is organized around six user intents rather than six copied app tabs:

1. **Home** — personal social context and current relationships.
2. **Explore** — discovery, topics, people, products, places, and emerging interests.
3. **Create** — publish, sell, communicate, and express.
4. **Connect** — messages, notifications, groups, relationships, saved conversations.
5. **Market** — shop, product discovery, carts, orders, seller tools.
6. **You** — profile, identity, preferences, privacy, creator/seller controls.

On phone, these intents are represented by a compact adaptive navigation system. On tablet/web, the same IA expands into a persistent rail plus contextual secondary navigation.

The exact visual navigation geometry is Drustpoll-specific and must not reproduce another platform's tab arrangement.

---

# 6. Complete surface inventory

Every surface below requires loading, success, empty, error, offline, permission, privacy, accessibility, and destructive-action states where applicable.

## 6.1 Entry and identity

- launch/splash;
- first-run introduction;
- sign up;
- sign in;
- phone/email verification;
- password setup;
- password reset;
- account recovery;
- device/session verification;
- passkey/security-key entry when supported;
- username selection;
- profile basics;
- avatar/media setup;
- interests setup;
- privacy baseline;
- notification baseline;
- recommendation preferences;
- blocked/muted import or setup;
- consent and legal surfaces.

Design principle: onboarding creates a useful first session quickly. It never asks for information that can be deferred without loss.

## 6.2 Home / social feed

- home header;
- feed mode selector;
- personalized feed;
- following/relationship feed;
- chronological/latest mode;
- topic feed;
- post composer entry;
- story-like temporary updates only if research and product need justify them;
- post card;
- photo gallery;
- video post;
- carousel;
- text-first post;
- link preview;
- poll;
- quote/repost;
- comments preview;
- full comment sheet/page;
- reactions;
- save;
- share sheet;
- hide/not-interested;
- mute/block/report;
- creator context;
- recommendation explanation;
- feed controls;
- feed reset/preferences;
- end-of-feed state;
- offline feed snapshot.

Feed behavior is designed around relevance + diversity + freshness + relationship + exploration + safety, not a single engagement metric.

## 6.3 Explore / discovery

- Explore landing;
- search entry;
- search suggestions;
- people results;
- posts results;
- short-video results;
- products results;
- shops results;
- topics;
- emerging topics;
- local discovery where explicitly permitted;
- category hubs;
- recommendation explanation;
- recent searches;
- saved searches;
- no-results recovery;
- typo/near-match recovery;
- privacy-aware discovery controls.

Discovery should combine exact retrieval, prefix retrieval, semantic/category signals where deterministic methods support them, behavioral relevance, diversity, and exploration. Search history is user-controlled.

## 6.4 Short video / reels

- video landing;
- personalized sequence;
- following sequence;
- topic sequence;
- video player;
- creator overlay;
- caption expansion;
- comments;
- sound/audio page;
- related videos;
- share;
- save;
- not-interested;
- hide creator;
- report;
- playback settings;
- quality selection;
- reduced-motion handling;
- data saver;
- preloading controls;
- offline/error state.

The sequence must diversify creators/topics and prevent repetitive exposure. User controls must be visible enough to be discoverable.

## 6.5 Profiles

- profile header;
- identity and bio;
- follow/connect state;
- follower/following lists;
- mutual context;
- posts;
- videos;
- media collections;
- tagged content;
- saved content (private);
- shop;
- product catalogue;
- creator information;
- seller information;
- verification state;
- profile privacy state;
- activity visibility;
- blocked/muted relationship state;
- profile report.

The profile is an identity surface, not a vanity dashboard. Important social metrics are contextual rather than visually dominant by default.

## 6.6 Create

- create chooser;
- text post;
- photo post;
- gallery;
- video;
- short video;
- poll;
- link;
- product post;
- product tag;
- draft list;
- draft editor;
- media trim/crop;
- caption/editor;
- accessibility alt-text;
- content warnings;
- audience selector;
- location selector;
- comment/reply controls;
- mention controls;
- preview;
- publish progress;
- publish success;
- publish failure/retry;
- scheduled publish only if justified by product needs.

Creation must preserve user work on failure and offline transitions.

## 6.7 Connect

### Messages
- inbox;
- conversation list;
- message requests;
- conversation;
- reply/thread;
- media message;
- voice note if supported;
- shared post/product;
- message search;
- pinned messages;
- disappearing-message settings if supported;
- encryption/security status;
- device verification;
- block/mute/report;
- message privacy controls;
- offline send queue;
- failed-send recovery.

### Notifications
- all;
- social;
- mentions/replies;
- follows;
- commerce/orders;
- security;
- system;
- notification preferences;
- digest settings;
- quiet periods.

Notifications are grouped by meaning, not optimized for maximum return frequency.

## 6.8 Market / commerce

- Market landing;
- product discovery;
- category page;
- search;
- filters;
- sort;
- product card;
- product detail;
- image gallery;
- product video;
- variant selection;
- seller card;
- seller storefront;
- seller profile;
- reviews;
- questions/answers;
- related products;
- similar products;
- saved products;
- wishlist;
- cart;
- cart editing;
- shipping address;
- delivery estimate;
- order summary;
- payment selection;
- payment confirmation;
- payment failure/retry;
- order success;
- order tracking;
- order history;
- return/refund;
- support;
- seller dashboard;
- inventory;
- product creation;
- product editing;
- pricing;
- shipping configuration;
- order management;
- payout status;
- commerce analytics.

Commerce must make total cost, seller identity, availability, delivery expectations, and payment state explicit before commitment.

## 6.9 Settings / identity / privacy

- account;
- security;
- devices/sessions;
- passkeys;
- password;
- email/phone;
- profile visibility;
- activity visibility;
- discoverability;
- message requests;
- blocked accounts;
- muted accounts;
- hidden words/topics;
- recommendation controls;
- feed reset;
- ad/privacy controls;
- data export;
- data deletion;
- download history;
- permissions;
- accessibility;
- appearance;
- motion;
- data saver;
- notification preferences;
- language;
- region/currency;
- legal;
- security events;
- privacy audit history where appropriate.

Privacy settings must use plain language, reversible controls, and visible current state.

## 6.10 Safety and moderation

- report composer;
- report reason selection;
- evidence attachment;
- block confirmation;
- mute confirmation;
- appeal status;
- account restriction state;
- content removal notice;
- safety education;
- abuse recovery;
- security alert;
- suspicious login;
- session revocation;
- compromised-device recovery.

Safety UI must be calm, specific, and non-accusatory while still being decisive where risk is high.

## 6.11 Web/tablet expansion

All mobile surfaces gain responsive variants rather than separate product concepts:
- persistent navigation rail;
- multi-column discovery;
- split conversation view;
- larger commerce comparison layout;
- keyboard navigation;
- hover/focus states;
- command/search palette;
- URL-addressable content;
- browser back/forward preservation;
- resizable media/player zones.

---

# 7. Component system

The design system must have reusable primitives before page-specific styling.

## Foundations
- AppShell;
- NavigationRail;
- ContextBar;
- SectionHeader;
- Surface;
- Divider;
- Text;
- Icon;
- Avatar;
- Media;
- Badge;
- Chip;
- Button;
- IconButton;
- Input;
- SearchField;
- SegmentedControl;
- Switch;
- Checkbox;
- Radio;
- Slider;
- Tabs;
- BottomSheet;
- Dialog;
- Toast;
- Snackbar;
- Tooltip;
- Skeleton;
- EmptyState;
- ErrorState;
- OfflineBanner;
- Progress;
- Pagination/Cursor;
- PullToRefresh;
- VirtualizedList.

## Social primitives
- PostHeader;
- PostBody;
- PostMedia;
- ReactionBar;
- CommentPreview;
- CommentThread;
- ShareSheet;
- CreatorContext;
- FollowButton;
- RecommendationReason;
- SocialProof;
- ContentWarning.

## Commerce primitives
- ProductCard;
- ProductGallery;
- PriceBlock;
- VariantSelector;
- InventoryState;
- SellerCard;
- RatingSummary;
- CartRow;
- OrderStatus;
- PaymentState;
- ShippingSummary;
- CheckoutStep;
- PurchaseConfirmation.

Every primitive defines all states before it is used broadly.

---

# 8. Interaction state model

Every interactive component has a minimum state machine:

`idle -> focused/pressed -> pending -> success | error -> recovered | idle`

Additional states:
- disabled;
- selected;
- unavailable;
- permission-denied;
- offline;
- private;
- blocked;
- muted;
- deleted;
- moderated;
- expired.

Rules:
- pending is visible for operations that can take perceptible time;
- optimistic state is allowed only when rollback is safe;
- server-confirmed state is visually distinguishable when commitment matters;
- no button says "success" before the server actually confirms success for irreversible operations.

---

# 9. Psychology layer — applied safely

## 9.1 Cognitive load

Reduce unnecessary choices, group related information, preserve context, and reveal advanced controls progressively.

## 9.2 Recognition over recall

Use persistent labels/icons where ambiguity is costly. Recent choices can be remembered locally, but users can inspect and reset personalization.

## 9.3 Progressive disclosure

Simple default surface; advanced controls one intentional level deeper. Privacy/security controls are exceptions: important controls stay discoverable.

## 9.4 Curiosity without deception

Use meaningful novelty, adjacent topics, surprising but relevant creators, and explainable recommendation transitions. Never hide the reason for an action solely to create uncertainty.

## 9.5 Social connection over status anxiety

Highlight people, conversations, context, and meaningful responses. Raw follower/like counts are secondary information rather than the primary visual reward.

## 9.6 Competence and control

Every major system should answer:
- What happened?
- Why did it happen?
- What can I do next?
- Can I undo it?
- Can I change this behavior?

## 9.7 Commerce confidence

Reduce purchase uncertainty using seller identity, price transparency, availability, delivery information, returns, reviews, and explicit payment confirmation rather than pressure tactics.

---

# 10. Personalization and ranking UX

The UI and ranking engine are one system.

Each personalized surface has a hidden scoring layer and a visible control layer.

### Ranking dimensions
- relevance;
- relationship strength;
- recent intent;
- long-term affinity;
- freshness;
- novelty;
- creator diversity;
- topic diversity;
- item diversity;
- fairness;
- safety;
- negative feedback;
- fatigue/repetition;
- context/device/session state where privacy permits.

### User-facing controls
- Follow/Following;
- Not interested;
- Hide creator;
- Mute topic;
- See less like this;
- See more like this;
- Reset recommendations;
- Why this appears;
- Following/latest mode;
- topic preferences.

Controls must be understandable without exposing proprietary ranking internals.

---

# 11. Commerce personalization

Product recommendations use multiple evidence types:
- recent browsing;
- product opens;
- saves;
- cart activity;
- purchases;
- category affinity;
- price-range affinity;
- seller affinity;
- availability;
- novelty;
- diversity;
- negative feedback;
- relationship/social context where explicitly relevant.

Do not infer sensitive traits merely to sell products. Avoid exploiting emotional vulnerability, financial distress, or private circumstances.

Recommendation explanations use simple language such as:
- "Because you saved…"
- "From shops you follow…"
- "Similar to items you viewed…"
- "A new option in a category you explore…"

Never fabricate the reason.

---

# 12. Privacy-by-design UI

Privacy is represented visually and behaviorally throughout the product.

Examples:
- profile visibility badge/state;
- audience label before publishing;
- message-request state;
- location-sharing state;
- device/security state;
- commerce data use explanation;
- recommendation data controls;
- data export/delete controls.

Sensitive information is not surfaced merely because it could improve personalization.

Default principle: collect the minimum information needed for the requested feature, retain it only as long as needed, and give the user a meaningful way to understand and control it.

---

# 13. Accessibility system

Accessibility is not a final QA pass.

Every page must support:
- screen readers;
- semantic roles;
- accessible names;
- dynamic text size;
- keyboard navigation on web;
- visible focus;
- reduced motion;
- sufficient contrast;
- non-color state indicators;
- touch target minimums;
- captions/transcripts where media requires them;
- alt text for meaningful images;
- error messages tied to fields;
- logical reading order.

Accessibility acceptance criteria are part of component definitions.

---

# 14. Performance contract

The interface should feel fast before it is technically complete.

Rules:
- render useful shell immediately;
- cache safe public/static resources;
- prefetch only likely-next content;
- avoid unnecessary network waterfalls;
- virtualize long lists;
- keep animations on performant properties;
- avoid blocking the main thread;
- compress/resize media appropriately;
- pause expensive work when backgrounded;
- preserve scroll position;
- use offline snapshots for recently available user content where privacy permits.

Measure:
- time to first useful paint;
- navigation latency;
- input latency;
- scroll stability;
- media start latency;
- memory pressure;
- battery impact;
- offline recovery time.

---

# 15. Offline and failure philosophy

Every network-dependent page has four explicit states:

1. fresh online;
2. stale but usable;
3. offline with queued action;
4. unavailable with recovery action.

User-created work is preserved whenever technically possible.

Queues are:
- durable;
- idempotent;
- bounded;
- retrying with backoff;
- observable;
- safe to replay.

The UI explains what is queued without exposing internal infrastructure jargon.

---

# 16. Micro-interaction catalogue

The following details are part of the design, not polish added later:

- button press feedback;
- follow confirmation;
- like/reaction acknowledgement;
- save confirmation;
- comment send state;
- share sheet entry/exit;
- composer attachment transition;
- upload progress;
- publish completion;
- post deletion undo;
- mute/block confirmation;
- notification grouping;
- unread marker behavior;
- message send/read state;
- typing indicator timing;
- online/offline presence semantics;
- cart add/remove;
- quantity changes;
- checkout step transitions;
- payment pending/success/failure;
- order status progression;
- pull-to-refresh;
- skeleton-to-content transition;
- empty state entrance;
- error recovery;
- offline reconnect;
- permission request explanation;
- privacy toggle confirmation;
- security alert acknowledgement.

Each must be tested for clarity, latency, accessibility, and reversibility.

---

# 17. Content density and responsive rhythm

### Phone
Prioritize one dominant task per viewport. Secondary information collapses into contextual sheets or sections.

### Tablet
Use two-pane layouts where context improves decision-making: feed/detail, search/results, conversation/list, product/detail.

### Desktop web
Use persistent navigation, multi-column information architecture, keyboard shortcuts, hover/focus previews, and denser commerce comparison layouts without making content visually noisy.

### Universal rule
Never solve responsive design by simply shrinking the phone layout.

---

# 18. Design QA gate

A surface is not complete until all applicable checks pass:

### Visual
- hierarchy;
- spacing;
- typography;
- semantic color;
- media composition;
- light/dark/high-contrast.

### Interaction
- idle;
- focus;
- pressed;
- loading;
- success;
- error;
- disabled;
- offline;
- destructive;
- undo/recovery.

### Psychology
- comprehension;
- choice clarity;
- no coercive defaults;
- meaningful feedback;
- controlled novelty;
- no fake urgency/social proof.

### Accessibility
- screen reader;
- keyboard;
- dynamic type;
- contrast;
- reduced motion;
- touch targets;
- semantic errors.

### Performance
- initial render;
- interaction latency;
- list virtualization;
- media loading;
- memory;
- offline transition.

### Privacy/security
- audience state;
- data minimization;
- sensitive-data exposure;
- secure actions;
- auditability;
- safe failure.

### Measurement
- task success;
- satisfaction;
- meaningful interaction;
- negative feedback;
- diversity/novelty;
- fairness;
- privacy comprehension;
- retention/value metrics;
- rollback trigger.

---

# 19. Product-wide success definition

Drustpoll is successful when users can say, without learning a complicated system:

> "I immediately understand where I am, what I can do, why I am seeing this, what happened after I acted, and I can change or undo important choices."

The product should feel unusually attractive because it is coherent, responsive, expressive, useful, and trustworthy — not because it traps attention.

---

# 20. Implementation order after design lock

The design system is implemented in this order:

1. tokens + typography + semantic colors;
2. app shell + navigation geometry;
3. state primitives + accessibility primitives;
4. feed/post primitives;
5. profile/identity primitives;
6. discovery/search primitives;
7. short-video primitives;
8. messaging primitives;
9. commerce primitives;
10. privacy/security primitives;
11. loading/offline/error primitives;
12. page composition;
13. personalization controls;
14. responsive web/tablet layouts;
15. motion/haptics;
16. performance optimization;
17. visual regression + accessibility testing;
18. controlled behavioral evaluation;
19. production hardening.

No feature should bypass the component/state/research gates simply because it is visually small.

---

## Final design constraint

**Every pixel, state, transition, page, control, ranking explanation, purchase step, privacy decision, empty state, error state, and micro-interaction is part of the product design. Nothing is considered too small to deserve evidence, accessibility, security, and measurement.**
