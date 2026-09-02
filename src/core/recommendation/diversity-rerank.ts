import type { CandidateSignals, RankingPolicy } from './ranking-contract';
import { scoreCandidate } from './ranking-contract';

export type FeedCandidate = CandidateSignals & {
  id: string;
  creatorId: string;
  topics: string[];
  format: string;
  source: 'following' | 'interest' | 'community' | 'discovery';
};

export type RerankConfig = {
  maxPerCreator: number;
  maxPerSource: number;
  topicRepeatPenalty: number;
  formatRepeatPenalty: number;
  explorationSlots: number;
};

const DEFAULT_CONFIG: RerankConfig = {
  maxPerCreator: 3,
  maxPerSource: 8,
  topicRepeatPenalty: 0.08,
  formatRepeatPenalty: 0.04,
  explorationSlots: 3,
};

function adjustedScore(
  candidate: FeedCandidate,
  selected: FeedCandidate[],
  policy: RankingPolicy,
  config: RerankConfig,
): number {
  let score = scoreCandidate(candidate, policy);
  const sameCreator = selected.filter(item => item.creatorId === candidate.creatorId).length;
  const sameSource = selected.filter(item => item.source === candidate.source).length;
  const topicOverlap = candidate.topics.reduce((sum, topic) => sum + selected.filter(item => item.topics.includes(topic)).length, 0);
  const formatOverlap = selected.filter(item => item.format === candidate.format).length;

  if (sameCreator >= config.maxPerCreator) return Number.NEGATIVE_INFINITY;
  if (sameSource >= config.maxPerSource) return Number.NEGATIVE_INFINITY;

  score -= sameCreator * 0.25;
  score -= sameSource * 0.04;
  score -= topicOverlap * config.topicRepeatPenalty;
  score -= formatOverlap * config.formatRepeatPenalty;
  return score;
}

/**
 * Greedy MMR-like feed re-ranking: preserve relevance while making repeated
 * creators/topics/formats less dominant. This is a tunable product contract,
 * not a claim that these constants are universally optimal.
 */
export function diversifyFeed(
  candidates: FeedCandidate[],
  limit: number,
  policy?: RankingPolicy,
  options: Partial<RerankConfig> = {},
): FeedCandidate[] {
  const config = { ...DEFAULT_CONFIG, ...options };
  const target = Math.max(0, Math.min(limit, candidates.length));
  const remaining = [...candidates];
  const selected: FeedCandidate[] = [];

  while (remaining.length && selected.length < target) {
    let bestIndex = -1;
    let bestScore = Number.NEGATIVE_INFINITY;
    for (let i = 0; i < remaining.length; i += 1) {
      const candidate = remaining[i];
      const score = adjustedScore(candidate, selected, policy, config);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }
    if (bestIndex < 0) break;
    selected.push(remaining.splice(bestIndex, 1)[0]);
  }

  if (config.explorationSlots <= 0 || remaining.length === 0) return selected;

  // Promote a small number of high-novelty, safe discovery candidates into
  // the tail when they are not already represented, avoiding a pure filter bubble.
  const exploration = remaining
    .filter(item => item.source === 'discovery' && item.safety >= 0.7)
    .sort((a, b) => (b.novelty + b.diversityContribution) - (a.novelty + a.diversityContribution))
    .slice(0, config.explorationSlots);

  if (!exploration.length) return selected;
  const replacementCount = Math.min(exploration.length, selected.length);
  return [...selected.slice(0, selected.length - replacementCount), ...exploration];
}
