import { query, withTransaction } from './db.js';

export type ReelWatchEventType = 'impression'|'start'|'progress'|'complete'|'skip'|'replay'|'like'|'save'|'share'|'comment'|'not_interested';

function nonNegative(value: unknown): number|null {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isSafeInteger(n) && n >= 0 ? n : null;
}

export async function startReelWatchSession(userId: string, clientSessionId?: string) {
  const r = await query<{id:string;started_at:Date}>(
    `INSERT INTO reel_watch_sessions(user_id,client_session_id) VALUES($1,$2) RETURNING id,started_at`,
    [userId, clientSessionId?.slice(0,128) ?? null],
  );
  return { sessionId:r.rows[0].id, startedAt:r.rows[0].started_at.toISOString() };
}

export async function endReelWatchSession(userId:string, sessionId:string) {
  const r=await query<{id:string;ended_at:Date}>(
    `UPDATE reel_watch_sessions SET ended_at=COALESCE(ended_at,now()) WHERE id=$1 AND user_id=$2 RETURNING id,ended_at`,
    [sessionId,userId],
  );
  if(!r.rowCount) throw new Error('Watch session not found');
  return {sessionId:r.rows[0].id,endedAt:r.rows[0].ended_at.toISOString()};
}

export async function recordReelWatchEvents(userId:string,sessionId:string,events:Array<{
  postId:string; eventType:ReelWatchEventType; position?:number; watchedMs?:number; videoDurationMs?:number; clientEventId?:string;
}>) {
  if(events.length>100) throw new Error('Too many watch events');
  return withTransaction(async client=>{
    const session=await client.query('SELECT 1 FROM reel_watch_sessions WHERE id=$1 AND user_id=$2',[sessionId,userId]);
    if(!session.rowCount) throw new Error('Watch session not found');
    let accepted=0;
    for(const event of events){
      if(!event.postId) continue;
      const watched=nonNegative(event.watchedMs), duration=nonNegative(event.videoDurationMs), position=nonNegative(event.position);
      if(watched!==null && duration!==null && watched>duration) continue;
      const post=await client.query(`SELECT 1 FROM posts p WHERE p.id=$1 AND p.deleted_at IS NULL AND EXISTS(SELECT 1 FROM post_media m WHERE m.post_id=p.id AND m.media_type='video')`,[event.postId]);
      if(!post.rowCount) continue;
      const r=await client.query(`INSERT INTO reel_watch_events(session_id,user_id,post_id,event_type,position,watched_ms,video_duration_ms,client_event_id)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(user_id,client_event_id) DO NOTHING`,
        [sessionId,userId,event.postId,event.eventType,position,watched,duration,event.clientEventId??null]);
      if(r.rowCount) accepted++;
    }
    return {accepted};
  });
}

export async function getReelCandidates(userId:string,limit=30){
  const size=Math.min(Math.max(Math.trunc(limit),1),50);
  const r=await query(`
    WITH watched AS (
      SELECT post_id, MAX(COALESCE(watched_ms,0)) AS watched_ms, MAX(COALESCE(video_duration_ms,0)) AS duration_ms
      FROM reel_watch_events WHERE user_id=$1 GROUP BY post_id
    ),
    excluded AS (
      SELECT DISTINCT post_id FROM reel_watch_events WHERE user_id=$1 AND event_type IN ('not_interested','skip') AND created_at>now()-interval '7 days'
    ),
    blocked AS (
      SELECT blocked_id user_id FROM user_blocks WHERE blocker_id=$1 UNION SELECT blocker_id FROM user_blocks WHERE blocked_id=$1
    ),
    creators AS (
      SELECT p.author_id, COUNT(*) exposures FROM recommendation_exposure e JOIN posts p ON p.id=e.post_id
      WHERE e.user_id=$1 AND e.surface='reels' AND e.shown_at>now()-interval '7 days' GROUP BY p.author_id
    )
    SELECT p.id,p.author_id,p.created_at,u.username,u.display_name,
      COALESCE(w.watched_ms,0)::int AS prior_watched_ms,
      COALESCE(w.duration_ms,0)::int AS prior_duration_ms,
      COALESCE(c.exposures,0)::int AS creator_exposures,
      COALESCE((SELECT COUNT(*) FROM post_reactions r WHERE r.post_id=p.id),0)::int AS likes,
      COALESCE((SELECT COUNT(*) FROM comments cm WHERE cm.post_id=p.id AND cm.deleted_at IS NULL),0)::int AS comments
    FROM posts p JOIN users u ON u.id=p.author_id
    LEFT JOIN watched w ON w.post_id=p.id LEFT JOIN creators c ON c.author_id=p.author_id
    WHERE p.deleted_at IS NULL AND p.visibility='public'
      AND EXISTS(SELECT 1 FROM post_media m WHERE m.post_id=p.id AND m.media_type='video')
      AND NOT EXISTS(SELECT 1 FROM excluded x WHERE x.post_id=p.id)
      AND NOT EXISTS(SELECT 1 FROM blocked b WHERE b.user_id=p.author_id)
    ORDER BY p.created_at DESC LIMIT $2`,[userId,size]);
  return r.rows;
}
