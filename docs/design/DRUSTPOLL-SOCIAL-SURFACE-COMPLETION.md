# Drustpoll Social Surface Completion Contract

Status: implementation target for the Home/social layer.

## Product surfaces

Home supports: For You, Following, Latest, topic feed, refresh, pagination, offline snapshot, end-of-feed state, post composer entry, text/photo/gallery/video/carousel/link/poll/repost posts, comments, threaded replies, reaction, save, share, repost/quote, recommendation explanation, more like this, less like this, not interested, hide, mute, block, report and creator context.

## Media

Posts can contain zero to ten moderated-ready media assets. A single image uses a focused hero frame. Multiple assets use a paged carousel. Video uses a native player with explicit controls. Tapping media opens a full-screen viewer. Every media item supports alt text where supplied; the UI never invents accessibility descriptions for meaningful content.

## Feed controls

Modes: `for_you`, `following`, `latest`. Controls are explicit and reversible. Recommendation feedback is persisted server-side. Feed reset clears recommendation feedback and records a reset event without deleting user content or social relationships. Hidden topics are independently manageable.

## Comments

Top-level comments and replies are distinct retrieval surfaces. Pagination uses stable time cursors. Private, deleted, blocked and otherwise ineligible posts are rejected server-side before comment access.

## Polls

Polls have a question, ordered options, optional multi-select and optional close time. Votes are authorized against the visible post and checked transactionally. A single-choice poll replaces the current choice; multi-select polls permit multiple options.

## Reposts

A repost is toggleable per user and can include a bounded quote. The original post remains the source of truth.

## Recommendation explanation

Explanations are factual UI labels based only on available signals. They never claim a causal reason that was not recorded. Generic explanation text is used when no single reason can be supported.

## Safety

Hide, mute, block and report require visible state transitions. Destructive actions use confirmation. Safety signals must not be converted into deceptive urgency or engagement pressure.

## Accessibility

All action controls expose an accessible role, name and state. State must not be communicated by color alone. Touch targets are at least 44 points where platform conventions permit. Reduced-motion preferences remove nonessential animation. Web surfaces must preserve keyboard navigation and visible focus.

## Offline and recovery

Read-only feed state may use a cached snapshot. User-authored actions are queued only when their API contract is idempotent or replay-safe. Every failed action exposes a useful retry/recovery path and does not silently discard user work.

## Measurement

Measure time-to-useful-content, interaction latency, task completion, recovery, meaningful interaction, diversity, novelty, negative feedback, privacy comprehension and accessibility defects. Session duration is not a primary success target.
