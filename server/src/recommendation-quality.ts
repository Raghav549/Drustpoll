export type RecommendationQualitySignals = {
  interactions: number;
  saves: number;
  comments: number;
  shares: number;
  impressions: number;
  exposureCount: number;
  durationMs: number;
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

/**
 * Exposure-normalized quality signal. Raw engagement is not treated as ground truth:
 * exposure, opportunity-to-interact and content duration are explicit confounders.
 * Coefficients are conservative starting points and must be validated offline/online.
 */
export function exposureNormalizedQuality(s: RecommendationQualitySignals): number {
  const impressions = Math.max(1, s.impressions);
  const opportunityRate = clamp01(s.exposureCount / impressions);
  const interactionRate = clamp01(s.interactions / impressions);
  const saveRate = clamp01(s.saves / impressions);
  const commentRate = clamp01(s.comments / impressions);
  const shareRate = clamp01(s.shares / impressions);
  const durationFactor = clamp01(s.durationMs / 30_000);
  const exposureCorrection = 1 - 0.35 * opportunityRate;

  return clamp01(
    (interactionRate * 0.30 + saveRate * 0.30 + commentRate * 0.15 + shareRate * 0.15 + durationFactor * 0.10) * exposureCorrection,
  );
}

export function diversityContribution<T extends { creatorId: string; topic?: string; format?: string }>(
  candidate: T,
  selected: readonly T[],
): number {
  if (!selected.length) return 1;
  const creatorCollision = selected.some(item => item.creatorId === candidate.creatorId);
  const topicCollision = Boolean(candidate.topic && selected.some(item => item.topic === candidate.topic));
  const formatCollision = Boolean(candidate.format && selected.some(item => item.format === candidate.format));
  return clamp01(1 - (creatorCollision ? 0.55 : 0) - (topicCollision ? 0.25 : 0) - (formatCollision ? 0.20 : 0));
}
