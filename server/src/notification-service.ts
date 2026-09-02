import { query } from './db.js';

export type NotificationType =
  | 'follow'
  | 'follow_request'
  | 'reaction'
  | 'comment'
  | 'mention'
  | 'message'
  | 'order_update'
  | 'system';

type NotificationInput = {
  recipientId: string;
  actorId?: string;
  type: NotificationType;
  objectId?: string;
  groupedKey?: string;
  metadata?: Record<string, unknown>;
};

export async function createNotification(input: NotificationInput) {
  if (input.actorId && input.actorId === input.recipientId) return null;
  const result = await query<{ id: string; created_at: Date }>(
    `INSERT INTO notifications(recipient_id, actor_id, type, object_id, grouped_key, metadata)
     VALUES($1,$2,$3,$4,$5,$6)
     RETURNING id, created_at`,
    [input.recipientId, input.actorId ?? null, input.type, input.objectId ?? null, input.groupedKey ?? null, JSON.stringify(input.metadata ?? {})],
  );
  return result.rows[0] ? { id: result.rows[0].id, createdAt: result.rows[0].created_at.toISOString() } : null;
}

export async function listNotifications(userId: string, limit = 30, before?: string) {
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 100);
  const result = await query(
    `SELECT n.id, n.actor_id, n.type, n.object_id, n.grouped_key, n.metadata,
            n.read_at, n.created_at,
            p.username AS actor_username, pr.display_name AS actor_display_name, pr.avatar_url AS actor_avatar_url
       FROM notifications n
       LEFT JOIN users p ON p.id = n.actor_id
       LEFT JOIN profiles pr ON pr.user_id = n.actor_id
      WHERE n.recipient_id=$1
        AND ($2::timestamptz IS NULL OR n.created_at < $2::timestamptz)
      ORDER BY n.created_at DESC
      LIMIT $3`,
    [userId, before ?? null, safeLimit],
  );
  return { notifications: result.rows, nextBefore: result.rows.length === safeLimit ? result.rows[result.rows.length - 1].created_at.toISOString() : null };
}

export async function unreadNotificationCount(userId: string) {
  const result = await query<{ count: string }>('SELECT count(*)::text AS count FROM notifications WHERE recipient_id=$1 AND read_at IS NULL', [userId]);
  return Number(result.rows[0]?.count ?? 0);
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const result = await query<{ id: string }>(
    'UPDATE notifications SET read_at=COALESCE(read_at,now()) WHERE id=$1 AND recipient_id=$2 RETURNING id',
    [notificationId, userId],
  );
  return { ok: result.rowCount === 1 };
}

export async function markAllNotificationsRead(userId: string) {
  const result = await query('UPDATE notifications SET read_at=now() WHERE recipient_id=$1 AND read_at IS NULL', [userId]);
  return { updated: result.rowCount ?? 0 };
}
