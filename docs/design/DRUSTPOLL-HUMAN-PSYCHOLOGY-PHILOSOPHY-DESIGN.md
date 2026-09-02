# Drustpoll Human Psychology + Philosophy Design Charter

## Purpose
Drustpoll should feel immediately understandable, calm, beautiful, responsive and rewarding to use without relying on deception, addiction loops, surveillance or opaque AI systems.

The product may use well-established findings from HCI, behavioral science, recommender-system research, cognitive psychology and philosophy of human agency. Research is used to improve human experience, never to bypass informed choice.

## Core philosophy

### 1. Agency before influence
The interface should persuade through clarity and quality, not coerce through friction, ambiguity or hidden defaults.

- Important choices are visible.
- Privacy controls are reversible.
- Recommendation controls are understandable.
- Declining an action is never intentionally harder than accepting it.
- No fake urgency, deceptive scarcity, forced continuity or disguised advertising.

### 2. Attraction through coherence
Instant appeal should come from a coherent visual and interaction language:

- strong hierarchy
- generous spacing
- predictable motion
- immediate feedback
- tactile interaction states
- high-quality media presentation
- stable navigation landmarks
- low cognitive load

The goal is **recognition before explanation**: users should understand what an element does from its shape, placement, state and feedback without reading a manual.

### 3. Flow without captivity
Drustpoll should support a smooth flow state while preserving the user's ability to stop, switch context or understand why something is being shown.

Use:
- fast perceived response
- skeletons only where they reduce uncertainty
- optimistic UI only for reversible local state
- preloading based on proximity and explicit user intent
- batched/background work where appropriate
- graceful empty, offline and failure states

Do not use:
- infinite interaction requirements
- forced autoplay where the user did not request it
- notification escalation designed to pull users back
- hidden exit paths
- friction deliberately added to cancellation or privacy choices

### 4. Meaningful social reward
Social feedback should reinforce connection and expression rather than status anxiety.

Prioritize:
- meaningful comments and replies
- creator/audience connection
- context around social activity
- user-controlled visibility
- healthy feedback summaries

Avoid making raw public counts the dominant psychological signal everywhere. Where counts are useful, present them with context and user control.

### 5. Curiosity with epistemic respect
Discovery should create a sense of "there is something worth exploring" without manufacturing uncertainty or deception.

Use:
- relevant novelty
- serendipitous but understandable recommendations
- topic and creator diversity
- transparent recommendation reasons when useful
- exploration surfaces distinct from personal-history surfaces

Never fabricate social proof, popularity, scarcity, reviews, availability or urgency.

### 6. Philosophy of plurality
A person's interests are not a single fixed profile. Drustpoll should preserve room for change, contradiction, exploration and forgotten interests.

Therefore ranking systems should balance:
- relevance
- novelty
- diversity
- fairness
- freshness
- relationship/context
- safety
- user control

A recommendation system must not define the user by a narrow behavioral history.

## Research-backed product behavior

Recent research supports moving recommendation design beyond raw engagement optimization toward user agency, transparency, diversity, fairness and long-term value. A 2026 short-video recommender study found that transparent, user-friendly controls can increase perceived empowerment and understanding of how recommendations steer attention. citeturn0search0turn0search9

A 2026 review of video recommender research synthesizes more than 572 academic publications and argues for multidimensional diversity, multimodality, fairness, transparency and human-centered trustworthy recommendation. citeturn0search2

A 2026 multi-objective recommendation study explicitly combines accuracy, fairness and serendipity rather than optimizing a single objective, supporting Drustpoll's multi-objective ranking direction. citeturn0search3

A 2026 recommender-systems perspective argues for re-centering evaluation on user agency, transparency, fairness, privacy and long-term welfare rather than system-centric proxy metrics. citeturn0search1

## Drustpoll interaction laws

1. **One action, one clear result.** Every primary interaction should produce immediate understandable feedback.
2. **State is visible.** Loading, saved, liked, followed, purchased, muted, blocked and failed states must be distinguishable.
3. **Motion explains change.** Animation communicates continuity and hierarchy; it must not delay essential actions.
4. **Touch targets are forgiving.** Hit areas should be larger than the visible glyph when appropriate.
5. **Context is preserved.** Returning from a detail surface should restore the relevant scroll/selection state when technically reasonable.
6. **The interface never lies.** No simulated activity, fake progress, fabricated availability or misleading confirmation.
7. **Privacy is a product feature.** Privacy state is part of the interaction model, not an afterthought.
8. **Commerce is explicit.** Price, seller, inventory state, shipping and payment state must be clear before commitment.
9. **Ranking is accountable.** Every ranking policy has measurable user-value, quality, diversity, safety and negative-feedback metrics.
10. **No AI dependency.** Core social, feed, discovery, commerce, privacy, messaging and security behavior must work without generative AI or opaque AI services. Advanced deterministic/statistical/research-backed algorithms may be used where they materially improve the product and can be audited.

## Visual language direction

Drustpoll must be visually original rather than a skin of Instagram or another major platform.

Design characteristics:
- editorial clarity instead of imitation
- premium but restrained surfaces
- strong typographic hierarchy
- distinctive navigation geometry
- purposeful micro-interactions
- responsive layouts for phone, tablet and web
- accessible contrast and motion preferences
- consistent semantic states across social and commerce

The visual system should feel sophisticated because of composition, rhythm, typography, motion and information architecture—not because of unnecessary decoration.

## Psychological safety guardrails

The following are prohibited product patterns:

- deceptive countdowns
- fake scarcity
- preselected privacy exposure
- difficult cancellation
- disguised ads
- guilt-based copy
- notification spam
- hidden recommendation controls
- intentionally confusing consent
- fabricated popularity or social proof
- reward schedules designed specifically to create compulsive checking

The objective is **high attraction, high usability and high perceived value without manipulation**.

## Evaluation before shipping

For any major interaction or surface, measure:

- task success
- time to comprehension
- interaction latency/perceived responsiveness
- error/recovery rate
- accessibility outcomes
- satisfaction
- meaningful interaction quality
- diversity/novelty where relevant
- privacy comprehension and control
- negative feedback
- long-term value rather than raw session length

A feature that increases clicks while worsening user understanding, autonomy, safety or satisfaction is not considered a successful optimization.

## Implementation rule

Before each meaningful feature is implemented:

1. identify the human problem;
2. review relevant peer-reviewed/credible research;
3. select the strongest applicable method;
4. document trade-offs and failure modes;
5. implement the smallest testable production behavior;
6. instrument it;
7. validate with automated tests and controlled experiments where appropriate;
8. retain rollback capability.

This charter is a permanent product constraint for Drustpoll.
