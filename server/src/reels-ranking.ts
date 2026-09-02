import { query } from './db.js';

export type ReelRankItem = { postId: string; creatorId: string; topic?: string; score: number; reason: string };

/** Duration-debiased sequence affinity: completion, replay and skip are normalized to [0,1]. */
export function watchAffinity(watchedMs: number, durationMs: number, replay = 0, skip = 0) {
  if (durationMs <= 0 || watchedMs < 0) return 0;
  const completion = Math.max(0, Math.min(1, watchedMs / durationMs));
  return Math.max(0, Math.min(1, completion * 0.7 + Math.min(1, Math.max(0, replay)) * 0.2 - Math.min(1, Math.max(0, skip)) * 0.35));
}

/** Greedy slate optimization with creator/topic redundancy penalties. */
export function diversifySlate(items: ReelRankItem[], size = 10) {
  const target = Math.min(Math.max(Math.trunc(size), 0), items.length);
  const remaining = [...items];
  const chosen: ReelRankItem[] = [];
  const creators = new Map<string, number>();
  const topics = new Map<string, number>();
  while (remaining.length && chosen.length < target) {
    let best = 0;
    let bestScore = -Infinity;
    remaining.forEach((item, i) => {
      const creatorPenalty = (creators.get(item.creatorId) ?? 0) * 0.16;
      const topicPenalty = item.topic ? (topics.get(item.topic) ?? 0) * 0.10 : 0;
      const score = item.score - creatorPenalty - topicPenalty;
      if (score > bestScore) { bestScore = score; best = i; }
    });
    const item = remaining.splice(best, 1)[0];
    chosen.push(item);
    creators.set(item.creatorId, (creators.get(item.creatorId) ?? 0) + 1);
    if (item.topic) topics.set(item.topic, (topics.get(item.topic) ?? 0) + 1);
  }
  return chosen;
}

export async function recordSlateExposure(userId: string, surface: 'feed'|'reels'|'shop', slate: Array<{postId:string;creatorId:string}>) {
  if (!slate.length) return 0;
  const bounded = slate.slice(0, 100);
  const values: string[] = [];
  const params: unknown[] = [userId, surface];
  bounded.forEach((x, i) => {
    if (!x.postId || !x.creatorId) return;
    const base = params.length;
    values.push(`($1,$${base + 1},$${base + 2},$2,$${base + 3},now())`);
    params.push(x.postId, x.creatorId, i);
  });
  if (!values.length) return 0;
  const r = await query(
    `INSERT INTO recommendation_exposure(user_id,post_id,creator_id,surface,position,shown_at) VALUES ${values.join(',')} ON CONFLICT DO NOTHING`,
    params,
  );
  return r.rowCount;
}
