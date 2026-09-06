# Drustpoll Final UX Specification

## Product direction
- Quiet, confident, human-first visual language.
- Primary action first; secondary copy only when needed.
- Progressive disclosure for multi-step flows.
- No repeated slogans, decorative paragraphs, or progress labels unless they help orientation.
- Auth should feel like a single continuous surface with smooth horizontal/opacity transitions.
- Preserve user-entered values across step changes and recoverable errors.

## Auth UX
### Sign in
- Header: compact Drustpoll mark + wordmark; Language icon/text control only in header.
- One short title: `Welcome back`
- Account field: `Username, email or phone`
- Password field with show/hide icon.
- Primary CTA: `Continue`
- Secondary: `Forgot password?`
- Footer: `Create account` link.
- Inline errors stay immediately below the affected field or action; no giant error card.

### Sign up
- Step 1: Name + username.
- Step 2: Email or phone.
- Step 3: Password.
- Avoid long explanatory copy. Use compact field labels and one-line hints only for validation.
- Continue button stays fixed near the lower safe area and uses press-scale/opacity feedback.
- Step transitions: horizontal slide + slight fade, 220–280ms, ease-out; no abrupt screen replacement.
- Back preserves state.
- Submit uses disabled/loading/success/error states without layout jumping.

## Language
- The complete registered locale list must be selectable.
- Selecting any registered locale immediately updates every visible UI string through the i18n provider.
- Persist selection locally.
- RTL locales switch layout direction.
- No hard-coded English strings in auth/navigation surfaces.
- Fallback is acceptable only for untranslated copy, never for the language selector itself.

## Brand mark
- Replace the current node/route illustration with a simple original geometric mark derived from the Drustpoll concept: one compact distinctive glyph that remains recognizable at 16–64px.
- Use one primary dark brand tone with a restrained accent; no gradients, orbit/ring decorations, or pseudo-3D effects.
- Mark must work as app icon, splash icon, header icon, avatar badge, and monochrome mark.

## Motion
- Navigation: 220–280ms.
- Button press: 80–120ms scale/opacity feedback.
- Loading: skeleton or subtle spinner only where useful.
- Error recovery must not reset the whole screen.
- Respect Reduce Motion where available.

## Visual system
- Background: warm off-white.
- Ink: near-black green-charcoal.
- Brand: deep green.
- Accent: one warm, high-contrast accent for selected/interactive states.
- Success/error/warning colors remain semantically distinct and accessible.
- Use whitespace, hierarchy, and consistent 8pt-based spacing.
- Avoid excessive rounded containers; use radius primarily for controls and grouped surfaces.

## Whole-app rule
Apply the same system to Home, Explore, Create, Connect, You, Market, Product, Cart, Checkout, Orders, Profile, Notifications, Privacy, Safety, Settings, Messaging, Reels, and empty/loading/error/offline states.
