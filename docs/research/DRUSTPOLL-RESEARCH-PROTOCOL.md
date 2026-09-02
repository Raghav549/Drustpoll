# Drustpoll Research-First Product Protocol

## Non-negotiable rule
Before implementing any meaningful product behavior, interaction, ranking rule, notification behavior, privacy choice, commerce UX, or social mechanic, review peer-reviewed/credible empirical research relevant to that decision. Prefer methods with replicated, experimental, systematic-review, or strong observational evidence. Record the evidence, applicability, trade-offs, and measurement plan before shipping.

This applies to **every layer**: product architecture, visual interaction, information architecture, feed/reels ranking, discovery, commerce recommendations, checkout, notifications, privacy controls, messaging, moderation, security UX, onboarding, retention mechanics and accessibility.

## Product principles
1. User control over manipulation.
2. Relevance balanced with diversity, serendipity and fairness.
3. Privacy choices must be clear, reversible and non-obstructive.
4. Notifications are intentional, grouped and user-controlled.
5. No dark patterns, deceptive scarcity, hidden defaults or engagement traps.
6. Every ranking objective must have counter-metrics for quality and wellbeing.
7. Accessibility and responsive interaction are first-class requirements.
8. Mobile and web share product semantics while respecting platform conventions.
9. The product must remain useful without generative AI or opaque AI dependencies.
10. Psychology and philosophy may inform interaction design, but never to bypass informed consent or user agency.

## Research-backed recommendation direction
- Candidate generation from follows, interests, graph/community signals and content similarity.
- Multi-objective ranking rather than raw engagement maximization.
- Re-ranking for exposure diversity to reduce over-specialization/filter-bubble risk.
- Serendipity injection using relevant-but-novel candidates.
- Source/community diversity constraints.
- Explainable recommendation reasons where useful.
- User-adjustable recommendation objectives where the evidence and interaction cost justify them.
- Continuous offline evaluation plus controlled online experiments before changing ranking weights.

## Current evidence anchors
- Areeb et al. (2023), *Filter bubbles in recommender systems: Fact or fallacy—A systematic review*, WIREs Data Mining and Knowledge Discovery, DOI: 10.1002/widm.1512.
- Kotkov, Veijalainen & Wang (2020), *How does serendipity affect diversity in recommender systems?*, Computing, DOI: 10.1007/s00607-018-0687-5.
- Helberger, Karppinen & D'Acunto, *Exposure diversity as a design principle for recommender systems*.
- Lex et al. (2023), *Beyond-accuracy: a review on diversity, serendipity, and fairness in recommender systems based on graph neural networks*, Frontiers in Big Data, DOI: 10.3389/fdata.2023.1251072.
- Kidwai et al. (2024), *Mitigating filter bubbles: Diverse and explainable recommender systems*, Journal of Intelligent & Fuzzy Systems, DOI: 10.3233/JIFS-219416.
- Fabbri et al. (2026), *Feeding the (short-video) feed: a design proposal for user control of social media recommender systems under the Digital Services Act*, International Journal of Human-Computer Studies, 214, 103811.
- *Multidimensional diversity in video recommender systems: a holistic framework of literature gaps and future directions* (2026), Intelligent Systems with Applications, 31, 200724; systematic synthesis of more than 572 academic publications.
- Khaitan & Shrivastava (2026), *Developing Fairness, Accuracy, and Serendipity Objective Functions for Recommendation System and Establishing Trade-off through Multi-Objective Evolutionary Optimization*, Information Processing & Management, 63(4), 104604.
- Pomo et al. (2026), *Re-centering the user in recommender system research*, International Journal of Human-Computer Studies.
- 2026 research on recommender fairness, bias, privacy and adversarial threats; recommendation quality must not be evaluated independently from system integrity and privacy.
- Community-aware recommendation research for reducing filter bubbles in social platforms.
- Diversification research showing reduced homogenization and potential reduction of fake-content interaction.
- Recent 2026 systematic-review evidence on social-media dark patterns: avoid autonomy-undermining engagement mechanisms.
- Recent 2026 HCI research on attention-capture dark patterns: optimize for meaningful flow, not compulsive dissociation.
- Research on social-privacy dark patterns: avoid obstruction and obfuscation in privacy controls.

## Human psychology + philosophy design rule
The target is **high attraction through coherence, usefulness, beauty, curiosity, social connection and responsiveness — not coercive manipulation**.

Allowed design goals:
- instant comprehension
- low cognitive load
- smooth flow
- meaningful feedback
- relevant curiosity
- serendipitous discovery
- strong sense of control
- predictable and purposeful motion
- emotionally intelligent but honest copy

Prohibited design goals:
- compulsive checking
- hidden behavioral conditioning
- deceptive urgency/scarcity
- guilt or shame to drive actions
- confusing consent
- difficult cancellation
- fabricated popularity/social proof
- notification escalation intended primarily to pull users back

## Privacy-first architecture principle
Core social, commerce, messaging, recommendation and security behavior must not require invasive centralized profiling. Prefer data minimization, explicit purpose boundaries, auditable events, short-lived derived signals where possible, user controls and privacy-preserving computation. Any advanced personalization method must document what data it needs, why it needs it, retention, access boundaries and deletion behavior.

## Measurement framework
Every major feature must define:
- Primary user-value metric.
- Quality metric.
- Diversity/novelty metric where relevant.
- Safety/privacy metric where relevant.
- Negative feedback metric.
- Accessibility metric where relevant.
- Comprehension/control metric for consequential choices.
- Retention metric that does not reward compulsive use.
- Experiment design and rollback condition.

## Definition of done
A feature is not considered production-ready merely because it works technically. It must also have evidence, accessibility review, privacy/security review, instrumentation, failure states, a measurable user-value hypothesis, abuse/failure testing, and a rollback path.
