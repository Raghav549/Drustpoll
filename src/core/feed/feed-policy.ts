import { FeedCandidateFeatures } from '../../domain/models';
import { DEFAULT_RANKING_POLICY, RankingPolicy, scoreCandidate } from '../recommendation/ranking-contract';

export type FeedDecision = {
  score: number;
  eligible: boolean;
  reason: 'ranked' | 'safety-filtered' | 'negative-feedback-risk';
};

export function evaluateCandidate(
  features: FeedCandidateFeatures,
  policy: RankingPolicy = DEFAULT_RANKING_POLICY,
): FeedDecision {
  if (features.safety < 0.5) {
    return { score: Number.NEGATIVE_INFINITY, eligible: false, reason: 'safety-filtered' };
  }

  const score = scoreCandidate(
    {
      relevance: features.relevance,
      relationship: features.relationship,
      quality: features.quality,
      freshness: features.freshness,
      predictedMeaningfulInteraction: features.meaningfulInteraction,
      novelty: features.novelty,
      diversityContribution: features.diversityContribution,
      creatorExposureBalance: features.creatorExposureBalance,
      safety: features.safety,
      negativeFeedbackRisk: features.negativeFeedbackRisk,
    },
    policy,
  );

  if (features.negativeFeedbackRisk >= 0.9) {
    return { score, eligible: false, reason: 'negative-feedback-risk' };
  }

  return { score, eligible: true, reason: 'ranked' };
}
