import { query, withTransaction } from './db.js';

export type FeedEventType =
  | 'impression' | 'open' | 'dwell' | 'like' | 'comment' | 'save' | 'share'
  | 'follow' | 'hide' | 'not_interested' | 'report' | 'mute';

const MEANINGFUL = new Set<FeedEventType>(['comment','save','share','follow','like']);
const VALID = new Set<FeedEventType>(['impression','open','dwell','like','comment','save','share','follow','hide','not_interested','report','mute']);

export async function recordFeedEvents(userId: string, events: Array<{
  postId?: string; creatorId?: string; eventType: FeedEventType; valueNum?: number;
  sessionId?: string; clientEventId?: string;
}>) {
  const limited = events.slice(0, 100);
  if (!limited.length) return { accepted: 0, acceptedClientEventIds: [] as string[] };
  return withTransaction(async client => {
    let accepted = 0; const acceptedClientEventIds: string[] = [];
    for (const event of limited) {
      if (!VALID.has(event.eventType) || !event.clientEventId || event.clientEventId.length > 160) continue;
      const value = event.valueNum === undefined ? null : event.valueNum;
      if (value !== null && (!Number.isFinite(value) || Math.abs(value) > 86400000)) continue;
      const result = await client.query(
        `INSERT INTO feed_events(user_id,post_id,creator_id,event_type,value_num,session_id,client_event_id)
         VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING`,
        [userId,event.postId ?? null,event.creatorId ?? null,event.eventType,value,event.sessionId ?? null,event.clientEventId],
      );
      if (!result.rowCount) continue;
      accepted++; acceptedClientEventIds.push(event.clientEventId);
      if (!event.postId) continue;
      const field = event.eventType === 'impression' ? 'impressions'
        : event.eventType === 'open' ? 'opens'
        : MEANINGFUL.has(event.eventType) ? 'meaningful_interactions'
        : event.eventType === 'hide' || event.eventType === 'not_interested' ? 'hides'
        : event.eventType === 'report' ? 'reports' : null;
      if (field) await client.query(
        `INSERT INTO post_counters(post_id,${field},updated_at) VALUES($1,1,now())
         ON CONFLICT(post_id) DO UPDATE SET ${field}=post_counters.${field}+1,updated_at=now()`, [event.postId]);
    }
    return { accepted, acceptedClientEventIds };
  });
}
