# Drustpoll Authentication Experience Specification

Status: implementation contract

## Intent
Authentication is a focused entry point, not a marketing card. The interface should feel editorial, calm and premium, with one decision per moment and no decorative container around the entire form.

## Principles
- Recognition over recall.
- Progressive disclosure: ask only what is necessary now.
- One dominant action per viewport.
- Inline validation close to the field.
- Password visibility, recovery and account switching remain discoverable.
- No fake success, fake loading or ambiguous errors.
- Server-confirmed authentication state before navigation.
- Preserve entered values on recoverable failures.
- Never expose whether an account exists through password-recovery messaging.

## Signup sequence
1. Identity: name + username.
2. Contact: optional email/phone verification when required by the product policy.
3. Password: strong password with visibility control and local quality guidance.
4. Review: account/privacy baseline and consent where applicable.
5. Create: server request.
6. Success: server-confirmed session then continue to profile setup or home.

The screen should visually communicate progress without turning the experience into a carousel. Use a thin progress indicator plus a small step label.

## Sign-in sequence
Single focused screen:
- account identifier;
- password;
- password visibility;
- primary Continue action;
- forgot password;
- create account.

Avoid oversized rounded cards, unnecessary headers, dense helper copy and repeated labels.

## Recovery sequence
1. Identifier.
2. Neutral confirmation.
3. Verification method.
4. Reset credential.
5. Re-authentication/session review when required.

## Visual grammar
- full-bleed canvas;
- narrow editorial column;
- left-aligned content;
- subtle structural rules instead of stacked cards;
- large but restrained display heading;
- field underline or quiet outline;
- primary action with strong contrast;
- no decorative illustration competing with the task;
- 44px+ touch targets.

## Psychological safety
Allowed: clarity, confidence, recognition, reduced cognitive load, meaningful feedback, predictable progress.
Forbidden: guilt, false urgency, social proof, forced consent, hidden cancellation, deceptive scarcity, confusing copy, or reward-like interaction loops.

## Error state
Errors must answer:
1. What went wrong?
2. Is my entered data preserved?
3. What should I do next?

Network errors should distinguish configuration failures from temporary connectivity problems. Installed Android builds must never silently attempt `http://localhost` or a developer machine address.

## Production acceptance
- No full-screen card shell around auth form.
- Sign-up is progressive, not a wall of fields.
- All fields have accessible labels and field-level error association.
- Submit disabled/pending state is visible.
- Failed request preserves data.
- Server success is required before redirect.
- Android build uses a real HTTPS API origin.
