export type RankingContext = {
  userId: string;
  now: number;
  session: {
    recentTopics: string[];
    recentCreators: string[];
    recentFormats: string[];
  };
};

export type CandidateSignals = {
  relevance: number;
  relationship: number;
  quality: number;
  freshness: number;
  predictedMeaningfulInteraction: number;
  novelty: number;
  diversityContribution: number;
  creatorExposureBalance: number;
  safety: number;
  negativeFeedbackRisk: number;
};

/**
 * Research-informed contract: ranking is multi-objective.
 * Do not collapse the system into a single engagement score.
 * Weights must be experimentally validated before production changes.
 */
export type RankingPolicy = {
  relevance: number;
  relationship: number;
  quality: number;
  freshness: number;
  meaningfulInteraction: number;
  novelty: number;
  diversity: number;
  creatorExposureBalance: number;
  safety: number;
  negativeFeedbackPenalty: number;
};

export const DEFAULT_RANKING_POLICY: RankingPolicy = {
  relevance: 0.20,
  relationship: 0.14,
  quality: 0.14,
  freshness: 0.08,
  meaningfulInteraction: 0.10,
  novelty: 0.08,
  diversity: 0.10,
  creatorExposureBalance: 0.04,
  safety: 0.12,
  negativeFeedbackPenalty: 0.18,
};

export function scoreCandidate(
  signals: CandidateSignals,
  policy: RankingPolicy = DEFAULT_RANKING_POLICY,
): number {
  const positive =
    signals.relevance * policy.relevance +
    signals.relationship * policy.relationship +
    signals.quality * policy.quality +
    signals.freshness * policy.freshness +
    signals.predictedMeaningfulInteraction * policy.meaningfulInteraction +
    signals.novelty * policy.novelty +
    signals.diversityContribution * policy.diversity +
    signals.creatorExposureBalance * policy.creatorExposureBalance +
    signals.safety * policy.safety;

  return positive - signals.negativeFeedbackRisk * policy.negativeFeedbackPenalty;
}
