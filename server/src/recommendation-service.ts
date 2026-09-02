import { query } from './db.js';

type RecommendationReason = 'following' | 'recent_interest' | 'fresh_creator' | 'diverse_discovery';

type Candidate = {
  id: string;
  author_id: string;
  created_at: Date;
  like_count: number;
  comment_count: number;
  save_count: number;
  media_count: number;
  relevance: number;
  relationship: number;
  freshness: number;
  quality: number;
  novelty: number;
  safety: number;
  negative_feedback_risk: number;
};

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function score(candidate: Candidate): number {
  return (
    candidate.relevance * 0.20 +
    candidate.relationship * 0.14 +
    candidate.quality * 0.14 +
    candidate.freshness * 0.08 +
    candidate.novelty * 0.08 +
    candidate.safety * 0.12 -
    candidate.negative_feedback_risk * 0.18
  );
}

function similarity(a: Candidate, b: Candidate): number {
  if (a.author_id === b.author_id) return 1;
  const timeGap = Math.abs(a.created_at.getTime() - b.created_at.getTime());
  return timeGap < 15 * 60 * 1000 ? 0.35 : 0.05;
}

function reason(candidate: Candidate, selected: Candidate[]): RecommendationReason {
  if (candidate.relationship > 0.7) return 'following';
  if (candidate.novelty > 0.75 && selected.some(item => item.author_id !== candidate.author_id)) return 'diverse_discovery';
  if (candidate.freshness > 0.75) return 'fresh_creator';
  return 'recent_interest';
}

/**
 * Research-backed architecture boundary: candidate generation is deliberately
 * separated from ranking and slate diversification. The weights are initial
 * hypotheses and must be validated offline/online before production tuning.
 */
export async function getRecommendedPosts(userId: string, limit = 20) {
  const size = Math.min(Math.max(Math.trunc(limit), 1), 50);
  const candidateLimit = Math.min(size * 8, 400);

  const result = await query<Candidate>(`
    WITH followed AS (
      SELECT followed_id FROM follows WHERE follower_id=$1 AND state='following'
    ),
    recent_seen AS (
      SELECT object_id FROM recommendation_events
      WHERE user_id=$1 AND object_type='post' AND created_at > now() - interval '14 days'
    ),
    blocked AS (
      SELECT blocked_id AS user_id FROM user_blocks WHERE blocker_id=$1
      UNION
      SELECT blocker_id AS user_id FROM user_blocks WHERE blocked_id=$1
    ),
    muted AS (
      SELECT muted_id AS user_id FROM user_mutes WHERE muter_id=$1
    ),
    raw AS (
      SELECT p.id,p.author_id,p.created_at,
        COALESCE((SELECT count(*)::int FROM post_reactions r WHERE r.post_id=p.id),0) AS like_count,
        COALESCE((SELECT count(*)::int FROM comments c WHERE c.post_id=p.id AND c.deleted_at IS NULL),0) AS comment_count,
        COALESCE((SELECT count(*)::int FROM post_saves s WHERE s.post_id=p.id),0) AS save_count,
        COALESCE((SELECT count(*)::int FROM post_media m WHERE m.post_id=p.id),0) AS media_count,
        CASE WHEN p.author_id IN (SELECT followed_id FROM followed) THEN 1.0 ELSE 0.35 END AS relationship,
        CASE WHEN p.created_at > now() - interval '6 hours' THEN 1.0
             WHEN p.created_at > now() - interval '1 day' THEN 0.75
             WHEN p.created_at > now() - interval '3 days' THEN 0.5 ELSE 0.2 END AS freshness,
        CASE WHEN p.author_id IN (SELECT followed_id FROM followed) THEN 0.85 ELSE 0.45 END AS relevance,
        CASE WHEN p.id IN (SELECT object_id FROM recent_seen) THEN 0.15 ELSE 0.8 END AS novelty,
        1.0 AS safety,
        CASE WHEN EXISTS (SELECT 1 FROM recommendation_feedback f WHERE f.user_id=$1 AND f.object_type='post' AND f.object_id=p.id) THEN 1.0 ELSE 0.0 END AS negative_feedback_risk
      FROM posts p
      WHERE p.deleted_at IS NULL
        AND (p.visibility='public' OR p.author_id=$1 OR p.author_id IN (SELECT followed_id FROM followed))
        AND p.author_id <> ALL(COALESCE((SELECT array_agg(user_id) FROM blocked), ARRAY[]::uuid[]))
        AND p.author_id <> ALL(COALESCE((SELECT array_agg(user_id) FROM muted), ARRAY[]::uuid[]))
      ORDER BY p.created_at DESC
      LIMIT $2
    )
    SELECT *, LEAST(1.0, (like_count + comment_count * 2 + save_count * 3 + media_count) / 100.0) AS quality
    FROM raw`, [userId, candidateLimit]);

  const candidates = result.rows.map(row => ({
    ...row,
    relevance: clamp(Number(row.relevance)),
    relationship: clamp(Number(row.relationship)),
    freshness: clamp(Number(row.freshness)),
    quality: clamp(Number(row.quality)),
    novelty: clamp(Number(row.novelty)),
    safety: clamp(Number(row.safety)),
    negative_feedback_risk: clamp(Number(row.negative_feedback_risk)),
  }));

  const selected: Candidate[] = [];
  const remaining = [...candidates];
  while (selected.length < size && remaining.length) {
    let bestIndex = 0;
    let bestScore = Number.NEGATIVE_INFINITY;
    for (let i = 0; i < remaining.length; i += 1) {
      const item = remaining[i];
      const redundancy = selected.length
        ? Math.max(...selected.map(existing => similarity(item, existing)))
        : 0;
      const diversityBonus = (1 - redundancy) * 0.10;
      const value = score(item) + diversityBonus;
      if (value > bestScore) {
        bestScore = value;
        bestIndex = i;
      }
    }
    selected.push(remaining.splice(bestIndex, 1)[0]);
  }

  return selected.map((item, index) => ({
    id: item.id,
    authorId: item.author_id,
    position: index,
    reason: reason(item, selected.slice(0, index)),
    score: Number(score(item).toFixed(6)),
  }));
}
