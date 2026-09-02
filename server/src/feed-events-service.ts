import { query, withTransaction } from './db.js';

export type FeedEventType =
  | 'impression' | 'open' | 'dwell' | 'like' | 'comment' | 'save' | 'share'
  | 'follow' | 'hide' | 'not_interested' | 'report' | 'mute';

const MEANINGFUL = new Set<FeedEventType>(['comment','save','share','follow','like']);
const EVENT_TYPES = new Set<FeedEventType>([
  'impression','open','dwell','like','comment','save','share','follow','hide','not_interested','report','mute',
]);

function validId(value: unknown) { return typeof value === 'string' && value.length >= 1 && value.length <= 200; }
function validClientEventId(value: unknown) { return typeof value === 'string' && value.length >= 1 && value.length <= 128; }
function validFinite(value: unknown) { return value == null || (typeof value === 'number' && Number.isFinite(value)); }

export async function recordFeedEvents(userId: string, events: Array<{
  postId?: string;
  creatorId?: string;
  eventType: FeedEventType;
  valueNum?: number;
  sessionId?: string;
  clientEventId?: string;
}>) {
  const limited = events.slice(0, 100);
  if (!limited.length) return { accepted: 0, acceptedClientEventIds: [] as string[] };

  const valid = limited.filter(event =>
    EVENT_TYPES.has(event.eventType) &&
    validClientEventId(event.clientEventId) &&
    (!event.postId || validId(event.postId)) &&
    (!event.creatorId || validId(event.creatorId)) &&
    (!event.sessionId || validId(event.sessionId)) &&
    validFinite(event.valueNum)
  );

  if (!valid.length) return { accepted: 0, acceptedClientEventIds: [] as string[] };

  return withTransaction(async client => {
    let accepted = 0;
    const acceptedClientEventIds: string[] = [];
    for (const event of valid) {
      const result = await client.query<{client_event_id:string}>(
        `INSERT INTO feed_events(user_id,post_id,creator_id,event_type,value_num,session_id,client_event_id)
         VALUES($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT(user_id,client_event_id) DO NOTHING
         RETURNING client_event_id`,
        [userId,event.postId ?? null,event.creatorId ?? null,event.eventType,event.valueNum ?? null,event.sessionId ?? null,event.clientEventId],
      );
      if (!result.rowCount) continue;
      accepted += 1;
      acceptedClientEventIds.push(result.rows[0].client_event_id);

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
    return { accepted, acceptedClientEventIds };
  });
}
