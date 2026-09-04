import { query, withTransaction } from './db.js';

export type NotificationType =
  | 'follow'
  | 'follow_request'
  | 'reaction'
  | 'comment'
  | 'mention'
  | 'message'
  | 'order_update'
  | 'security'
  | 'system';

export type NotificationCategory = 'social'|'mentions_replies'|'follows'|'commerce_orders'|'security'|'system';
export type DigestFrequency = 'daily'|'weekly';

type NotificationInput = {
  recipientId: string;
  actorId?: string;
  type: NotificationType;
  objectId?: string;
  groupedKey?: string;
  metadata?: Record<string, unknown>;
};

const categoryFor=(type:NotificationType):NotificationCategory=>{
  if(type==='mention'||type==='comment')return'mentions_replies';
  if(type==='follow'||type==='follow_request')return'follows';
  if(type==='order_update')return'commerce_orders';
  if(type==='security')return'security';
  if(type==='system')return'system';
  return'social';
};

export async function getNotificationPreferences(userId:string){
  const r=await query(`SELECT social,mentions_replies,follows,commerce_orders,security,system,digest_enabled,digest_frequency,quiet_enabled,quiet_start_minute,quiet_end_minute,quiet_timezone,updated_at FROM notification_preferences WHERE user_id=$1`,[userId]);
  return r.rows[0]??{social:true,mentions_replies:true,follows:true,commerce_orders:true,security:true,system:true,digest_enabled:false,digest_frequency:'daily',quiet_enabled:false,quiet_start_minute:1320,quiet_end_minute:420,quiet_timezone:'UTC',updated_at:null};
}

export async function updateNotificationPreferences(userId:string,input:Record<string,unknown>){
  const current=await getNotificationPreferences(userId);
  const bool=(key:string,fallback:boolean)=>typeof input[key]==='boolean'?Boolean(input[key]):fallback;
  const freq=(input.digestFrequency==='weekly'?'weekly':'daily') as DigestFrequency;
  const start=input.quietStartMinute==null?Number(current.quiet_start_minute??1320):Math.min(1439,Math.max(0,Math.trunc(Number(input.quietStartMinute))));
  const end=input.quietEndMinute==null?Number(current.quiet_end_minute??420):Math.min(1439,Math.max(0,Math.trunc(Number(input.quietEndMinute))));
  const timezone=String(input.quietTimezone??current.quiet_timezone??'UTC').trim().slice(0,80)||'UTC';
  await query(`INSERT INTO notification_preferences(user_id,social,mentions_replies,follows,commerce_orders,security,system,digest_enabled,digest_frequency,quiet_enabled,quiet_start_minute,quiet_end_minute,quiet_timezone,updated_at)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,now())
    ON CONFLICT(user_id) DO UPDATE SET social=$2,mentions_replies=$3,follows=$4,commerce_orders=$5,security=$6,system=$7,digest_enabled=$8,digest_frequency=$9,quiet_enabled=$10,quiet_start_minute=$11,quiet_end_minute=$12,quiet_timezone=$13,updated_at=now()`,[
      userId,bool('social',Boolean(current.social)),bool('mentionsReplies',Boolean(current.mentions_replies)),bool('follows',Boolean(current.follows)),bool('commerceOrders',Boolean(current.commerce_orders)),bool('security',Boolean(current.security)),bool('system',Boolean(current.system)),bool('digestEnabled',Boolean(current.digest_enabled)),freq,bool('quietEnabled',Boolean(current.quiet_enabled)),start,end,timezone]);
  return getNotificationPreferences(userId);
}

export async function createNotification(input: NotificationInput) {
  if (input.actorId && input.actorId === input.recipientId) return null;
  const category=categoryFor(input.type);
  const pref=await getNotificationPreferences(input.recipientId);
  const enabled=(pref as any)[category=== 'mentions_replies'?'mentions_replies':category=== 'commerce_orders'?'commerce_orders':category]!==false;
  if(!enabled)return null;
  const result = await query<{ id: string; created_at: Date }>(
    `INSERT INTO notifications(recipient_id, actor_id, type, object_id, grouped_key, metadata, category)
     VALUES($1,$2,$3,$4,$5,$6,$7)
     RETURNING id, created_at`,
    [input.recipientId, input.actorId ?? null, input.type, input.objectId ?? null, input.groupedKey ?? null, JSON.stringify(input.metadata ?? {}),category],
  );
  return result.rows[0] ? { id: result.rows[0].id, createdAt: result.rows[0].created_at.toISOString() } : null;
}

export async function listNotifications(userId: string, limit = 30, before?: string, category?: string) {
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 100);
  const allowed=['all','social','mentions_replies','follows','commerce_orders','security','system'];
  const wanted=allowed.includes(category??'all')?(category??'all'):'all';
  const result = await query(
    `SELECT n.id, n.actor_id, n.type, n.object_id, n.grouped_key, n.metadata, n.category,
            n.read_at, n.created_at,
            p.username AS actor_username, pr.display_name AS actor_display_name, pr.avatar_url AS actor_avatar_url
       FROM notifications n
       LEFT JOIN users p ON p.id = n.actor_id
       LEFT JOIN profiles pr ON pr.user_id = n.actor_id
      WHERE n.recipient_id=$1
        AND ($2::timestamptz IS NULL OR n.created_at < $2::timestamptz)
        AND ($3='all' OR n.category=$3)
      ORDER BY n.created_at DESC
      LIMIT $4`,
    [userId, before ?? null, wanted, safeLimit],
  );
  return { notifications: result.rows, nextBefore: result.rows.length === safeLimit ? result.rows[result.rows.length - 1].created_at.toISOString() : null };
}

export async function unreadNotificationCount(userId: string) {
  const result = await query<{ count: string }>('SELECT count(*)::text AS count FROM notifications WHERE recipient_id=$1 AND read_at IS NULL', [userId]);
  return Number(result.rows[0]?.count ?? 0);
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const result = await query<{ id: string }>('UPDATE notifications SET read_at=COALESCE(read_at,now()) WHERE id=$1 AND recipient_id=$2 RETURNING id',[notificationId,userId]);
  return { ok: result.rowCount === 1 };
}

export async function markAllNotificationsRead(userId: string) {
  const result = await query('UPDATE notifications SET read_at=now() WHERE recipient_id=$1 AND read_at IS NULL', [userId]);
  return { updated: result.rowCount ?? 0 };
}

export async function getNotificationDigest(userId:string){
  const pref=await getNotificationPreferences(userId);
  if(!pref.digest_enabled)return{enabled:false,items:[]};
  const interval=String(pref.digest_frequency)==='weekly'?'7 days':'1 day';
  const r=await query(`SELECT category,type,COUNT(*)::int AS count,MAX(created_at) AS latest FROM notifications WHERE recipient_id=$1 AND created_at>now()-($2::interval) GROUP BY category,type ORDER BY latest DESC`,[userId,interval]);
  return{enabled:true,frequency:pref.digest_frequency,items:r.rows};
}

export async function getQuietPeriodState(userId:string,at=new Date()){
  const p=await getNotificationPreferences(userId);if(!p.quiet_enabled)return{active:false};
  const minute=at.getHours()*60+at.getMinutes();const start=Number(p.quiet_start_minute??1320),end=Number(p.quiet_end_minute??420);
  const active=start<=end?minute>=start&&minute<end:minute>=start||minute<end;
  return{active,startMinute:start,endMinute:end,timezone:p.quiet_timezone};
}
