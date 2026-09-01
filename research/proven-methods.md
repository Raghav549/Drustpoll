# Drustpoll — Evidence-backed product research

This document is the product-research contract for Drustpoll. We will use findings that have empirical evaluation, systematic review evidence, or established recommender-system methodology. We will **not** intentionally implement dark patterns, coercive engagement loops, deceptive defaults, or psychological manipulation designed to override user autonomy.

## 20 research anchors and implementation decisions

| # | Research anchor | Evidence / method | Drustpoll application |
|---|---|---|---|
| 1 | Campana & Delmastro, *Recommender Systems for Online and Mobile Social Networks* (2023 survey) | Social context + content/user signals; distributed recommendation concerns | Multi-signal candidate generation: graph, content, context and behavior |
| 2 | Anandhan et al., *Social Media Recommender Systems: Review and Open Research Issues* (IEEE Access, 2018) | Review of 61 RS papers and datasets/metrics | Offline evaluation suite + explicit recommendation metrics |
| 3 | Deldjoo et al., *Fairness in Recommender Systems* (2024) | Survey of 160+ scholarly works | Exposure/fairness constraints and auditable ranking |
| 4 | Zhao et al., *Fairness and Diversity in Recommender Systems* (2025) | User/item diversity + fairness connection | Diversity budget in Feed/Reels/Shop ranking |
| 5 | Kunaver & Požrl, *Diversity in recommender systems* (2017) | Diversity improves recommendation quality; algorithms/evaluation | Avoid repetitive feeds; personalized topic/creator diversity |
| 6 | Kotkov et al., *A survey of serendipity in recommender systems* (2016) | Relevance + novelty + unexpectedness | Controlled “serendipity” slots in discovery |
| 7 | de Gemmis et al., *An investigation on the serendipity problem* (2015) | Knowledge-infused graph recommendation; user evaluation | Graph-aware unexpected-but-relevant recommendations |
| 8 | Du et al., *Is diversity optimization always suitable?* (2021) | Personalized diversity can outperform generic post-processing | Diversity is user-specific, not a fixed percentage for everyone |
| 9 | *Ranking by engagement and non-engagement signals: Learnings from industry* (2025) | Engagement alone is insufficient; quality/non-engagement signals matter | Ranking objective includes satisfaction/quality signals, not likes alone |
| 10 | Shibuya et al., *Mapping HCI research methods for studying social media interaction* (2022) | Systematic review of 149 HCI papers; mixed methods are valuable | Product analytics + qualitative research + user testing |
| 11 | *Taking stock of social media privacy* (2026) | Meta-analysis links control/trust/concerns with privacy behavior | Clear privacy center, granular controls and visible data-use explanations |
| 12 | Acquisti & Loewenstein et al., *Choice Architecture, Framing, and Cascaded Privacy Choices* (2018) | Experiments on privacy choice architecture | Privacy settings designed for informed choice, not platform advantage |
| 13 | Bauer et al., *Are you sure, you want a cookie?* (2021) | Randomized field trial: choice architecture substantially changed consent | No manipulative consent UI; equal-weight accept/reject choices |
| 14 | Skotida et al., *How does the design of social media content controls shape users' choice?* (2025/26) | Randomized online experiment; defaults strongly affected content-control choices | User-controlled recommendation filters with non-manipulative defaults |
| 15 | Fournier et al., *Attention hijacked: How social media notifications disrupt cognitive processing* (2026) | Ecological experiment; alerts caused transient processing slowdown | Notification batching, relevance controls, quiet hours and low-noise defaults |
| 16 | Sherman et al., *The Power of the Like in Adolescence* (2016) | Instagram-like fMRI/behavioral study; peer endorsement affected liking | Avoid popularity-only ranking and visible social-pressure mechanics |
| 17 | *What the brain “Likes”* (2018) | Instagram-like fMRI study; social feedback engages reward circuitry | Use likes as social feedback, but never optimize for compulsive reward loops |
| 18 | *Intervening on Social Comparisons on Social Media* (2023) | Daily-diary pilot intervention using social savoring | Positive-context prompts and comparison-aware wellbeing tools |
| 19 | *The Impact of Social Comparisons More Related to Ability vs Opinion on Well-Being* (2023) | N=409 Instagram exposure experiment | Avoid ranking/status UI that unnecessarily intensifies ability-based comparison |
| 20 | *Combined well-being effects of social media activities: self-affirmation…* (2025) | Two preregistered experiments; self-affirmation reduced envy effects | User profile/self-expression surfaces can support healthy identity before discovery |

## Product principles derived from the evidence

### 1. The ranking objective is multi-dimensional
Do not use `likes` or raw watch time as the sole objective. The ranking layer will combine predicted relevance, meaningful interaction, quality, freshness, creator/user relationship, diversity, novelty/serendipity, negative feedback and wellbeing/satisfaction proxies.

Conceptual score:

`score = relevance + relationship + quality + freshness + meaningful_interaction + diversity + serendipity - repetition - negative_feedback - safety_penalty`

Weights will be learned/evaluated, not hard-coded as claims of “the Instagram algorithm”.

### 2. Diversity is personalized
A user who loves one topic should not receive a completely random feed, but the system should also avoid an unbroken repetition loop. Candidate reranking will use user-specific diversity and novelty budgets.

### 3. Serendipity is deliberate, not random
Discovery should occasionally surface something outside the user's immediate history while maintaining relevance. This is the mechanism for “I never knew I would like this.”

### 4. User control is a first-class ranking signal
Users can tune interests, hide topics, reduce sensitive content, reset recommendations, choose chronological/following views, control notification intensity and inspect why something was recommended.

### 5. Notifications are relevance-gated
No notification storm. The system will batch low-priority events and let users control categories and quiet periods.

### 6. Social proof is not the product's steering wheel
Likes/follower counts can exist, but popularity will not automatically dominate distribution. Quality, relevance and diversity remain first-class.

### 7. No dark patterns
No deceptive defaults, fake urgency, forced consent, hidden unsubscribe, misleading buttons, or intentional friction designed to keep users trapped.

### 8. Research becomes an engineering loop
Every major ranking/UI change should have:
- hypothesis
- metric definition
- offline evaluation
- controlled experiment when appropriate
- safety/privacy review
- retention/satisfaction analysis
- rollback criterion

## Research status

These papers are evidence anchors, not a guarantee that every proposed product feature will work for every population. Drustpoll will validate its own implementation with controlled experiments and user research before treating a design as proven.
