# Drustpoll — Final Auth, Language & Identity Product Spec

Status: implementation contract.

## Auth journey
Sign in is deliberately compact. Sign up is a three-step progression: identity → verified contact → password. Each step has one dominant action, visible progress, reversible navigation, inline validation, pending feedback and recovery.

Email/phone verification is a real server-authoritative OTP challenge. Codes are six digits, time-bound and attempt-limited. The client never creates or validates OTPs locally. Verification has explicit loading, success, invalid/expired, resend cooldown, offline and recovery states.

## Account security
Passwords are hashed server-side; access/session tokens are random and stored client-side through secure storage. Sessions have expiry, rotation, device association, revocation and security audit events. Sensitive operations require re-authentication where applicable.

## Email delivery
Transactional email is isolated in `server/src/email-service.ts`. SMTP credentials are supplied only as server-side environment variables. The sender address is configurable and should be the verified mailbox chosen by the operator. Templates are branded, plain-text + HTML, explicit about expiry, and never expose account existence through recovery responses.

## Language architecture
The language chooser is a first-class entry surface and settings surface. It persists locale locally and must eventually drive one translation dictionary/provider contract across every copy-bearing surface. Supported product locales are intentionally broad, including Indian languages plus major international languages, with RTL metadata for right-to-left locales.

A locale change must change the whole UI, not only the settings screen. Any unsupported string falls back safely to the default locale while the translation coverage gate reports the missing key during development.

## Identity / logo
The Drustpoll mark is an independent network-inspired symbol built from connected nodes and a living orbit. It appears on splash, selected identity moments and selected settings/security contexts. Product pages should not stamp the logo everywhere; identity is stronger when used sparingly.

## Design psychology
Use recognition, progressive disclosure, cognitive-load reduction, semantic grouping, feedback, controlled novelty, coherence and user agency. Never use deceptive scarcity, fake social proof, hidden controls, coercive defaults, or compulsive notification loops. Attraction comes from visual rhythm and confident information architecture.
