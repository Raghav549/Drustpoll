# Drustpoll Ranking Engine v1

The ranking engine is designed as a multi-objective recommender rather than a single engagement maximizer.

## Pipeline

1. **Eligibility** — privacy, safety, moderation, block/mute, age/region and policy filters.
2. **Candidate generation** — followed creators, social graph, content similarity, semantic topics, local/contextual candidates, trending candidates and exploration pool.
3. **Prediction** — estimate meaningful interaction, completion, save/share, hide/report probability, satisfaction and relevance.
4. **Reranking** — apply personalized diversity, freshness, creator/item repetition limits and serendipity.
5. **User controls** — apply explicit interests, reduced-topic settings, chronological mode and feedback.
6. **Logging** — record model version, candidate source, ranking reasons and privacy-safe event identifiers.
7. **Evaluation** — offline metrics + controlled experiments + safety/wellbeing review.

## Event taxonomy

Positive: `view`, `meaningful_view`, `complete`, `rewatch`, `like`, `comment`, `save`, `share`, `follow`, `product_open`, `add_to_cart`, `purchase`.

Negative: `skip`, `hide`, `not_interested`, `mute`, `unfollow`, `report`, `block`, `rapid_repeat_exposure`.

Explicit: `topic_follow`, `topic_hide`, `feed_reset`, `content_control_change`, `chronological_mode`.

## Important guardrails

- Raw time-on-screen is never the sole optimization target.
- Repetition is penalized per user, creator and topic.
- Exploration is bounded and relevant.
- Popularity is one feature, not the objective.
- Sensitive content is filtered before ranking.
- User feedback can override inferred interests.
- Ranking explanations must be understandable: e.g. “Because you follow X” or “Because you watch Y.”
- Every model version is auditable and rollbackable.

## Initial scoring contract

The production implementation should normalize each feature and learn weights from validated data. A transparent initial heuristic can be used only for cold-start testing:

`S = 0.30R + 0.15C + 0.12Q + 0.10M + 0.08F + 0.08D + 0.07N + 0.05E - 0.10P - 0.20H`

Where:
- R = predicted relevance
- C = relationship/context strength
- Q = content quality
- M = meaningful interaction probability
- F = freshness
- D = diversity contribution
- N = novelty/serendipity contribution
- E = explicit user preference
- P = repetition penalty
- H = negative-feedback/safety penalty

These coefficients are **temporary bootstrapping values**, not research claims. They must be replaced or calibrated through evaluation.
