import { query, withTransaction } from './db.js';

export type FeedEventType =
  | 'impression'
  | 'open'
  | 'dwell'
  | 'like'
  | 'comment'
  | 'save'
  | 'share'
  | 'follow'
  | 'hide'
  | 'not_interested'
  | 'report'
  | 'mute';

const MEANINGFUL = new Set<FeedEventType>(['comment','save','share','follow','like']);

export async function recordFeedEvents(userId: string, events: Array<{
  postId?: string;
  creatorId?: string;
  eventType: FeedEventType;
  valueNum?: number;
  sessionId?: string;
  clientEventId?: string;
}>) {
  const limited = events.slice(0, 100);
  if (!limited.length) return { accepted: 0 };

  return withTransaction(async client => {
    let accepted = 0;
    for (const event of limited) {
      const result = await client.query(
        `INSERT INTO feed_events(user_id,post_id,creator_id,event_type,value_num,session_id,client_event_id)
         VALUES($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT DO NOTHING`,
        [userId,event.postId ?? null,event.creatorId ?? null,event.eventType,
         Number.isFinite(event.valueNum ?? 0) ? event.valueNum ?? null : null,
         event.sessionId ?? null,event.clientEventId ?? null],
      );
      if (!result.rowCount) continue;
      accepted += 1;

      if (event.postId) {
        const field = event.eventType === 'impression' ? 'impressions'
          : event.eventType === 'open' ? 'opens'
          : MEANINGFUL.has(event.eventType) ? 'meaningful_interactions'
          : event.eventType === 'hide' || event.eventType === 'not_interested' ? 'hides'
          : event.eventType === 'report' ? 'reports'
          : null;
        if (field) {
          await client.query(
            `INSERT INTO post_counters(post_id,${field},updated_at) VALUES($1,1,now())
             ON CONFLICT(post_id) DO UPDATE SET ${field}=post_counters.${field}+1,updated_at=now()`,
            [event.postId],
          );
        }
      }
    }
    return { accepted };
  });
}
