# Drustpoll — final UX research decisions

## Method
The product uses a research-first loop: evidence → explicit design decision → measurable outcome → experiment/rollback. Retention must come from usefulness, social connection, curiosity and control rather than deceptive scarcity or compulsive interaction patterns.

## Commerce
Checkout uses progressive disclosure, recognizable controls, visible totals, persistence of entered values, explicit recovery and an unambiguous final action. Baymard's current research reports substantial checkout friction and emphasizes reducing unnecessary form complexity and improving error recovery. See: https://baymard.com/research/checkout-usability

## Recommendations
Ranking UX should balance relevance with novelty/diversity/serendipity and let users provide explicit feedback. Serendipity-oriented recommendation research shows that pure similarity/popularity can produce overly familiar recommendations; controlled novelty can improve discovery. See Kotkov et al., *How does serendipity affect diversity in recommender systems?* (Computing, 2020).

## Authentication
Passkeys use WebAuthn semantics where supported: scoped public-key credentials, explicit user consent, origin binding and privacy-preserving credential handling. See W3C WebAuthn Level 3, 2026 snapshot.

## Psychology and philosophy guardrails
- Autonomy: explain consequential choices and make them reversible where possible.
- Cognitive load: show only the next necessary decision while keeping context visible.
- Recognition over recall: familiar interaction patterns with Drustpoll-specific visual language.
- Agency over persuasion: no fake social proof, hidden controls, countdown pressure, forced notifications, or misleading labels.
- Trust through legibility: sponsored content is marked; recommendation reasons and privacy/data use are explainable.
- Meaningful feedback: state changes are clear, timely, reversible and accessible.

## Visual system
Drustpoll keeps a distinct Living Canvas system: semantic color tokens, editorial spacing, custom SVG iconography, restrained elevation, and motion that communicates state rather than decorating every interaction. Accessibility and reduced motion are first-class states.
