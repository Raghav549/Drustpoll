# Drustpoll Profile — Complete Closure

A profile is a social identity surface, relationship surface, safety surface, creator surface, seller surface, and privacy boundary.

## Required states
- loading, refreshing, empty, error, retry, offline, private, followers-only, blocked, muted, deleted/unavailable
- own profile and another user's profile

## Header
Avatar, display name, username, bio, website, verification state, creator category, seller state, privacy/activity state, location only when explicitly discoverable.

## Relationships
Connect/follow, requested, following, unfollow, follower list, following list, mutual context. Relationship changes are server-authoritative and blocked users cannot interact.

## Content
Posts, videos, collections, tagged posts, private saved posts for owner, shop. Each content surface supports pagination and explicit empty states.

## Commerce
Profile-linked storefront, seller summary, active catalogue, seller support/return policy boundary, product navigation.

## Safety
Explicit block, mute, report actions. Actions are reversible where appropriate and never hidden behind dark patterns.

## Privacy
Server-side visibility enforcement is required for profile, follower/following, collections, tagged content, location and shop surfaces. No client-only hiding is considered sufficient.

## Accessibility
Every interactive element has a semantic role, readable label, selected/disabled state, and at least a 44px interaction target. Icons are decorative when labels already provide meaning.

## Performance
Profile header and tabs may load independently. Content is paginated. Images/media are bounded. No unbounded queries.

## Completion gate
Profile is not complete until frontend surface, API contract, database schema, authorization/privacy filtering, safety controls, accessibility, offline/recovery behavior, analytics/measurement, and automated tests all exist for the surface.
