# Drustpoll UI / psychology evidence notes

Implementation choices are intentionally grounded in established interaction research and accessibility standards.

- Visibility of system status, user control/freedom, consistency, error prevention, recognition rather than recall, and aesthetic/minimalist presentation are used as interaction heuristics.
- WCAG 2.2 target size and focus requirements are treated as platform QA constraints, not optional polish.
- Privacy and commerce use explicit choices, visible state, and reversible/recoverable paths instead of deceptive urgency, disguised advertising, buried costs, or difficult cancellation.
- Engagement design focuses on comprehension, relevance, belonging, curiosity and agency; it does not use fake scarcity, fake social proof, forced consent or notification pressure.
- Authentication uses a clear boundary for passkeys; until a real WebAuthn registration ceremony is implemented and tested, the UI must not pretend that a passkey has been enrolled.

Sources reviewed during the implementation pass: W3C WCAG 2.2; W3C WebAuthn Level 3 (2026 Candidate Recommendation); FTC, Bringing Dark Patterns to Light (2022); Nielsen Norman Group usability heuristics.
